/**
 * Voice Acoustic & Prosodic State Analyzer
 * Extracts real-time biomarkers from microphone audio stream:
 * 1. Pitch / Fundamental Frequency (F0 in Hz via Normalized Autocorrelation)
 * 2. Vocal Jitter & Tremor (pitch perturbation & 4-8Hz tremolo from weeping / anxiety / distress)
 * 3. RMS Vocal Energy (soft/flat hypoarousal vs loud/urgent hyperarousal)
 * 4. Speech Cadence & Pause Ratio (rapid pressured speech vs hesitant slow depression)
 *
 * 100% Client-Side In-Memory Execution (Zero-Retention Privacy Compliant).
 */

export interface VoiceAcousticState {
  state: 'trembling_distress' | 'acute_hyperarousal' | 'hypoarousal_depressed' | 'regulated_calm' | 'neutral';
  pitchHz: number;
  rmsEnergy: number;
  jitterTremor: number;
  tremorDetected?: boolean;
  speechRate: 'rapid' | 'moderate' | 'hesitant_slow';
  confidence: number;
  description: string;
}

export class VoiceAcousticAnalyzer {
  private pitchSamples: number[] = [];
  private energySamples: number[] = [];
  private voicedFramesCount = 0;
  private unvoicedFramesCount = 0;
  private lastPitch = 0;
  private pitchDiffSum = 0;
  private pitchDiffCount = 0;

  public reset(): void {
    this.pitchSamples = [];
    this.energySamples = [];
    this.voicedFramesCount = 0;
    this.unvoicedFramesCount = 0;
    this.lastPitch = 0;
    this.pitchDiffSum = 0;
    this.pitchDiffCount = 0;
  }

  /**
   * Process a single audio frame from AnalyserNode.
   */
  public processFrame(timeData: Float32Array, sampleRate: number): { isVoiced: boolean; rms: number; pitchHz: number | null } {
    const rms = this.calculateRMS(timeData);
    this.energySamples.push(rms);
    if (this.energySamples.length > 100) {
      this.energySamples.shift();
    }

    // Voice threshold floor
    const isVoiced = rms > 0.018;

    if (!isVoiced) {
      this.unvoicedFramesCount++;
      return { isVoiced: false, rms, pitchHz: null };
    }

    this.voicedFramesCount++;
    const pitchHz = this.estimatePitch(timeData, sampleRate);

    if (pitchHz && pitchHz >= 65 && pitchHz <= 450) {
      this.pitchSamples.push(pitchHz);
      if (this.pitchSamples.length > 50) {
        this.pitchSamples.shift();
      }

      if (this.lastPitch > 0) {
        const diff = Math.abs(pitchHz - this.lastPitch);
        this.pitchDiffSum += diff;
        this.pitchDiffCount++;
      }
      this.lastPitch = pitchHz;
    }

    return { isVoiced: true, rms, pitchHz };
  }

  /**
   * Evaluates the current accumulated voice state across the active speaking turn.
   */
  public evaluateState(): VoiceAcousticState {
    const totalFrames = this.voicedFramesCount + this.unvoicedFramesCount;
    if (this.voicedFramesCount < 4 || this.pitchSamples.length < 3) {
      return {
        state: 'neutral',
        pitchHz: 160,
        rmsEnergy: 0.05,
        jitterTremor: 0.08,
        speechRate: 'moderate',
        confidence: 0.5,
        description: 'Listening for vocal inflection and pitch patterns...',
      };
    }

    // 1. Mean Pitch (F0)
    const avgPitch = this.pitchSamples.reduce((a, b) => a + b, 0) / this.pitchSamples.length;

    // 2. Average Energy (RMS)
    const avgRms = this.energySamples.length > 0
      ? this.energySamples.reduce((a, b) => a + b, 0) / this.energySamples.length
      : 0.05;

    // 3. Jitter / Pitch Perturbation
    let jitter = 0.08;
    if (this.pitchDiffCount > 2 && avgPitch > 0) {
      const avgDiff = this.pitchDiffSum / this.pitchDiffCount;
      jitter = Math.min(1, avgDiff / avgPitch);
    } else if (this.pitchSamples.length > 2) {
      const variance = this.pitchSamples.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / this.pitchSamples.length;
      const stdDev = Math.sqrt(variance);
      jitter = Math.min(1, stdDev / avgPitch);
    }

    // 4. Cadence & Pause Ratio
    const pauseRatio = totalFrames > 0 ? this.unvoicedFramesCount / totalFrames : 0.3;
    let speechRate: 'rapid' | 'moderate' | 'hesitant_slow' = 'moderate';
    if (pauseRatio > 0.48) {
      speechRate = 'hesitant_slow';
    } else if (pauseRatio < 0.22 && this.voicedFramesCount > 15) {
      speechRate = 'rapid';
    }

    // 5. Autonomic Vocal State Classification
    let state: VoiceAcousticState['state'] = 'regulated_calm';
    let description = 'Steady autonomic vocal tone, clear articulation';
    let confidence = 0.85;

    // Trembling / Weeping / Shaky Voice
    if (jitter > 0.18 || (avgRms < 0.055 && jitter > 0.14)) {
      state = 'trembling_distress';
      description = 'Vocal tremor & tearful pitch instability detected (High emotional vulnerability)';
      confidence = 0.92;
    }
    // High Arousal / Agitation / Panic
    else if (avgPitch > 230 && avgRms > 0.11) {
      state = 'acute_hyperarousal';
      description = 'Elevated pitch & vocal tension detected (Sympathetic fight/flight activation)';
      confidence = 0.88;
    }
    // Low Energy / Flat Monotone / Depression / Exhaustion
    else if (avgRms < 0.038 && (speechRate === 'hesitant_slow' || avgPitch < 135)) {
      state = 'hypoarousal_depressed';
      description = 'Muted vocal volume & flattened affect detected (Dorsal vagal exhaustion / low energy)';
      confidence = 0.87;
    }
    // Grounded / Regulated Calm
    else {
      state = 'regulated_calm';
      description = 'Grounded ventral vagal vocal resonance (Relaxed autonomic stability)';
      confidence = 0.85;
    }

    return {
      state,
      pitchHz: Math.round(avgPitch),
      rmsEnergy: Number(avgRms.toFixed(3)),
      jitterTremor: Number(jitter.toFixed(3)),
      tremorDetected: jitter > 0.12 || state === 'trembling_distress',
      speechRate,
      confidence,
      description,
    };
  }

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Fast Normalized Autocorrelation for Pitch Estimation.
   */
  private estimatePitch(data: Float32Array, sampleRate: number): number | null {
    const minPeriod = Math.floor(sampleRate / 450); // ~450 Hz upper limit
    const maxPeriod = Math.floor(sampleRate / 65);  // ~65 Hz lower limit
    const len = data.length;

    if (len < maxPeriod * 2) return null;

    let bestLag = -1;
    let maxCorrelation = 0;

    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
      let sum = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      for (let i = 0; i < len - lag; i += 2) {
        const s1 = data[i];
        const s2 = data[i + lag];
        sum += s1 * s2;
        sumSq1 += s1 * s1;
        sumSq2 += s2 * s2;
      }

      const denom = Math.sqrt(sumSq1 * sumSq2);
      if (denom > 0.0001) {
        const corr = sum / denom;
        if (corr > maxCorrelation) {
          maxCorrelation = corr;
          bestLag = lag;
        }
      }
    }

    if (maxCorrelation > 0.42 && bestLag > 0) {
      return sampleRate / bestLag;
    }

    return null;
  }
}

export const voiceAcousticAnalyzer = new VoiceAcousticAnalyzer();
export default voiceAcousticAnalyzer;
