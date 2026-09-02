/**
 * lib/memory/efficacy-tracker.ts
 *
 * Real-Time CBT Intervention Efficacy Tracker & Emotional Trajectory Engine.
 * Calculates emotional valence deltas across conversational turns, updates
 * technique success rates, and extracts profound breakthrough anchor phrases.
 */

import { CBTThoughtRecord, UserCognitiveProfile, TurnTrajectoryPoint } from './cbt-memory-types';
import { cognitiveVault } from './cognitive-vault';
import { NeuroscienceDiagnosticResult } from '../knowledge/emotion-classifier';

// High distress emotional dimensions
const DISTRESS_EMOTIONS = new Set([
  'anxiety', 'fear', 'sadness', 'anger', 'horror', 'disgust', 'empathic_pain', 'confusion', 'awkwardness'
]);

// Positive / grounding emotional dimensions
const POSITIVE_EMOTIONS = new Set([
  'calmness', 'relief', 'satisfaction', 'joy', 'interest', 'awe', 'amusement', 'triumph', 'pride', 'contentment'
]);

export class EfficacyTracker {
  private static instance: EfficacyTracker;
  private pendingTurn: TurnTrajectoryPoint | null = null;
  private lastAssistantIntervention: CBTThoughtRecord['interventionUsed'] | null = null;

  public static getInstance(): EfficacyTracker {
    if (!EfficacyTracker.instance) {
      EfficacyTracker.instance = new EfficacyTracker();
    }
    return EfficacyTracker.instance;
  }

  /**
   * Registers a user utterance turn with its 27-D emotional diagnostic baseline.
   */
  public async registerUserTurn(
    userText: string,
    diagnostic: NeuroscienceDiagnosticResult
  ): Promise<void> {
    const dimId = (diagnostic.dimensionId || 'calmness').toLowerCase();
    const intensity = diagnostic.intensity === 'peak' ? 90 : diagnostic.intensity === 'moderate' ? 65 : 40;
    const valence = diagnostic.coreAffect?.valence ?? 0;
    const arousal = diagnostic.coreAffect?.arousal ?? 0;

    const currentPoint: TurnTrajectoryPoint = {
      turnId: `turn-${Date.now()}`,
      timestamp: Date.now(),
      userUtterance: userText,
      dominantEmotion: diagnostic.dimensionName || 'Calmness',
      emotionIntensity: intensity,
      valence,
      arousal,
      activeDistortion: diagnostic.metaIntent || 'none',
      appliedIntervention: this.lastAssistantIntervention || undefined,
    };

    // If there is a previous turn pending an outcome evaluation, score the trajectory shift
    if (this.pendingTurn && this.lastAssistantIntervention) {
      await this.evaluateTrajectoryShift(this.pendingTurn, currentPoint, this.lastAssistantIntervention);
    }

    this.pendingTurn = currentPoint;
    this.lastAssistantIntervention = null;
  }

  /**
   * Records the assistant's applied reframing / regulation intervention.
   */
  public registerAssistantIntervention(
    category: CBTThoughtRecord['interventionUsed']['category'],
    promptHook: string
  ): void {
    this.lastAssistantIntervention = { category, promptHook };
  }

  /**
   * Evaluates the emotional delta between T0 and T2 to determine intervention efficacy.
   */
  private async evaluateTrajectoryShift(
    preTurn: TurnTrajectoryPoint,
    postTurn: TurnTrajectoryPoint,
    intervention: CBTThoughtRecord['interventionUsed']
  ): Promise<void> {
    const preDim = preTurn.dominantEmotion.toLowerCase();
    const postDim = postTurn.dominantEmotion.toLowerCase();

    // 1. Calculate distress change
    const wasPreDistressed = DISTRESS_EMOTIONS.has(preDim);
    const isPostDistressed = DISTRESS_EMOTIONS.has(postDim);
    const isPostRelieved = POSITIVE_EMOTIONS.has(postDim);

    let preDistressScore = wasPreDistressed ? preTurn.emotionIntensity : 20;
    let postDistressScore = isPostDistressed ? postTurn.emotionIntensity : 15;

    let prePositiveScore = !wasPreDistressed ? preTurn.emotionIntensity : 10;
    let postPositiveScore = isPostRelieved ? postTurn.emotionIntensity : 15;

    // Valence Shift Delta Formula: (Distress_T0 - Distress_T2) + (Positive_T2 - Positive_T0)
    const distressReduction = preDistressScore - postDistressScore;
    const positiveElevation = postPositiveScore - prePositiveScore;
    const valenceDelta = Math.round(distressReduction + positiveElevation);

    const isSuccessful = valenceDelta >= 20;

    // 2. Extract potential breakthrough realization in user follow-up
    const userFollowUp = postTurn.userUtterance.toLowerCase();
    const isBreakthrough =
      isSuccessful &&
      (userFollowUp.includes('guess') ||
        userFollowUp.includes('realize') ||
        userFollowUp.includes('feel better') ||
        userFollowUp.includes('makes sense') ||
        userFollowUp.includes('true') ||
        userFollowUp.includes('calmer') ||
        userFollowUp.includes('breath') ||
        userFollowUp.includes('right'));

    // 3. Create CBT Thought Record
    const thoughtRecord: CBTThoughtRecord = {
      id: `record-${Date.now()}`,
      timestamp: Date.now(),
      triggerEvent: preTurn.userUtterance,
      automaticThought: preTurn.userUtterance,
      identifiedDistortion: preTurn.activeDistortion,
      interventionUsed: intervention,
      outcome: {
        preScore: { emotion: preTurn.dominantEmotion, percentage: preTurn.emotionIntensity },
        postScore: { emotion: postTurn.dominantEmotion, percentage: postTurn.emotionIntensity },
        valenceDelta,
        isSuccessful,
      },
    };

    await cognitiveVault.saveThoughtRecord(thoughtRecord);

    // 4. Update the persistent User Cognitive Profile
    const profile = await cognitiveVault.getCognitiveProfile();

    // Update Efficacy Matrix
    const matrix = [...profile.interventionEfficacyMatrix];
    const techIndex = matrix.findIndex((m) => m.technique === intervention.category);

    if (techIndex >= 0) {
      const entry = matrix[techIndex];
      const totalAttempts = entry.totalAttempts + 1;
      const successfulAttempts = entry.successfulAttempts + (isSuccessful ? 1 : 0);
      const successRate = Number((successfulAttempts / totalAttempts).toFixed(2));
      matrix[techIndex] = { ...entry, totalAttempts, successfulAttempts, successRate };
    } else {
      matrix.push({
        technique: intervention.category,
        totalAttempts: 1,
        successfulAttempts: isSuccessful ? 1 : 0,
        successRate: isSuccessful ? 1.0 : 0.0,
      });
    }

    // Update Breakthrough Anchors if profound insight was vocalized
    const breakthroughs = [...profile.breakthroughAnchors];
    if (isBreakthrough) {
      breakthroughs.push({
        insightPhrase: postTurn.userUtterance.trim(),
        contextTrigger: preTurn.userUtterance.trim(),
        timestamp: Date.now(),
      });
    }

    // Update Recurring Distortions frequency
    const topDistortions = [...profile.topRecurringDistortions];
    if (preTurn.activeDistortion && preTurn.activeDistortion !== 'none') {
      const distIndex = topDistortions.findIndex(
        (d) => d.distortion.toLowerCase() === preTurn.activeDistortion.toLowerCase()
      );
      if (distIndex >= 0) {
        topDistortions[distIndex].frequency += 1;
        if (!topDistortions[distIndex].typicalTriggers.includes(preTurn.userUtterance)) {
          topDistortions[distIndex].typicalTriggers.push(preTurn.userUtterance);
        }
      } else {
        topDistortions.push({
          distortion: preTurn.activeDistortion,
          frequency: 1,
          typicalTriggers: [preTurn.userUtterance],
        });
      }
    }

    await cognitiveVault.updateProfileWithLearning({
      interventionEfficacyMatrix: matrix,
      breakthroughAnchors: breakthroughs.slice(-10),
      topRecurringDistortions: topDistortions,
    });
  }

  /**
   * Resets active session in-memory tracker.
   */
  public resetSession(): void {
    this.pendingTurn = null;
    this.lastAssistantIntervention = null;
  }
}

export const efficacyTracker = EfficacyTracker.getInstance();
