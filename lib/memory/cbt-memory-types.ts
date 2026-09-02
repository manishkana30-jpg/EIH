/**
 * lib/memory/cbt-memory-types.ts
 *
 * Core Data Models & Schemas for Autonomous On-Device CBT Memory & Adaptive Learning.
 * Stores thought records, core belief schemas, breakthrough insights, and intervention efficacy.
 */

export interface CBTThoughtRecord {
  id: string;
  timestamp: number;
  triggerEvent: string;             // e.g., "Performance review meeting" or "Driving test"
  automaticThought: string;         // e.g., "I am definitely getting fired" or "I feel so stupid"
  identifiedDistortion: string;     // e.g., "Catastrophizing", "Personalization", "All-or-Nothing"
  interventionUsed: {
    category:
      | 'socratic_questioning'
      | 'evidence_testing'
      | 'de-catastrophizing'
      | 'somatic_pranayama'
      | 'sattvavajaya_smriti'
      | 'behavioral_activation';
    promptHook: string;             // The specific angle or anchor used in the response
  };
  outcome: {
    preScore: { emotion: string; percentage: number };   // e.g., { emotion: "Anxiety", percentage: 85 }
    postScore: { emotion: string; percentage: number };  // e.g., { emotion: "Calmness", percentage: 65 }
    valenceDelta: number;           // Calculated recovery shift (+43)
    isSuccessful: boolean;          // true if delta >= +20
  };
}

export interface UserCognitiveProfile {
  version: number;
  lastUpdated: number;
  primarySchemas: {                 // Core underlying beliefs
    belief: string;                 // e.g., "I must be perfect to be valued"
    reinforcementCount: number;
    associatedDistortions: string[];
  }[];
  topRecurringDistortions: {
    distortion: string;             // e.g., "Personalization", "All-or-Nothing"
    frequency: number;
    typicalTriggers: string[];
  }[];
  interventionEfficacyMatrix: {
    technique: string;              // e.g., "somatic_pranayama", "socratic_questioning"
    successRate: number;            // 0.0 to 1.0 based on historical outcomes
    totalAttempts: number;
    successfulAttempts: number;
  }[];
  breakthroughAnchors: {            // Specific user-derived insights that worked
    insightPhrase: string;          // e.g., "A mistake in the test is not a character flaw"
    contextTrigger: string;
    timestamp: number;
  }[];
  doshicBaseline: {
    dominantTendency: 'vata_panic' | 'pitta_criticism' | 'kapha_resignation' | 'sattva_balanced';
    effectiveGroundingPranayama: string; // e.g., "Nadi Shodhana", "Shitali", "Surya Bhedana"
  };
}

export interface TurnTrajectoryPoint {
  turnId: string;
  timestamp: number;
  userUtterance: string;
  dominantEmotion: string;
  emotionIntensity: number; // 0 to 100
  valence: number;          // -1.0 to 1.0
  arousal: number;          // -1.0 to 1.0
  activeDistortion: string;
  appliedIntervention?: {
    category: CBTThoughtRecord['interventionUsed']['category'];
    promptHook: string;
  };
}
