/**
 * lib/knowledge/cbt-library.ts
 * Comprehensive Evidence-Based CBT & Schema Knowledge Base + Auto-Upgrade Client.
 *
 * Implements:
 * - 20+ Evidence-Based Cognitive Distortions (Beck & Burns taxonomy)
 * - 18 Early Maladaptive Schemas (Jeffrey Young)
 * - 8 Core Clinical CBT & ACT Protocols (7-Column DTR, Downward Arrow, Decatastrophizing)
 * - Heuristic Cognitive Distortion Detector
 * - Socratic Question & Reframing Engine
 */

import cbtData from './cbt-library.json';

export interface CBTDistortion {
  id: string;
  name: string;
  aka: string[];
  category: string;
  description: string;
  clinical_mechanism: string;
  example_thought: string;
  reframing_prompt: string;
  socratic_questions: string[];
  somatic_anchor: string;
  recommended_protocol: string;
  trigger_regex: string;
}

export interface CBTSchema {
  id: string;
  name: string;
  domain: string;
  core_belief: string;
  behavioral_pattern: string;
  somatic_marker: string;
}

export interface CBTProtocol {
  id: string;
  name: string;
  evidence_base: string;
  steps: string[];
}

export interface CBTLibraryManifest {
  version: string;
  name: string;
  last_updated: string;
  checksum_sha256: string;
  auto_upgrade_enabled: boolean;
  source_registries: string[];
}

export interface CBTLibraryData {
  manifest: CBTLibraryManifest;
  cognitive_distortions: CBTDistortion[];
  maladaptive_schemas: CBTSchema[];
  clinical_protocols: CBTProtocol[];
}

export interface CBTAnalysisResult {
  detected_distortions: CBTDistortion[];
  primary_distortion: CBTDistortion | null;
  socratic_prompts: string[];
  reframing_insight: string;
  recommended_protocol: CBTProtocol | null;
  somatic_cue: string;
  confidence_score: number;
}

export interface ThoughtRecordEntry {
  situation: string;
  emotionName: string;
  initialIntensity: number; // 0-100
  automaticThought: string;
  identifiedDistortion: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedPerspective: string;
  finalIntensity: number; // 0-100
  createdAt: string;
}

class CBTLibraryEngine {
  private data: CBTLibraryData;

  constructor(initialData: CBTLibraryData = cbtData as CBTLibraryData) {
    this.data = initialData;
  }

  public getManifest(): CBTLibraryManifest {
    return this.data.manifest;
  }

  public getAllDistortions(): CBTDistortion[] {
    return this.data.cognitive_distortions;
  }

  public getDistortionById(id: string): CBTDistortion | undefined {
    return this.data.cognitive_distortions.find((d) => d.id === id);
  }

  public getAllSchemas(): CBTSchema[] {
    return this.data.maladaptive_schemas;
  }

  public getSchemaById(id: string): CBTSchema | undefined {
    return this.data.maladaptive_schemas.find((s) => s.id === id);
  }

  public getAllProtocols(): CBTProtocol[] {
    return this.data.clinical_protocols;
  }

  public getProtocolById(id: string): CBTProtocol | undefined {
    return this.data.clinical_protocols.find((p) => p.id === id);
  }

  /**
   * Fast, zero-latency clinical distortion detector using rule-based heuristics & regex matching.
   */
  public analyzeUtterance(text: string): CBTAnalysisResult {
    if (!text || !text.trim()) {
      return {
        detected_distortions: [],
        primary_distortion: null,
        socratic_prompts: [],
        reframing_insight: "",
        recommended_protocol: null,
        somatic_cue: "",
        confidence_score: 0.0,
      };
    }

    const matches: { distortion: CBTDistortion; weight: number }[] = [];

    for (const distortion of this.data.cognitive_distortions) {
      try {
        const regex = new RegExp(distortion.trigger_regex, 'i');
        if (regex.test(text)) {
          matches.push({ distortion, weight: 1.0 });
        }
      } catch {
        // Fallback keyword matching if regex fails
        const lower = text.toLowerCase();
        if (distortion.aka.some((aka) => lower.includes(aka.toLowerCase()))) {
          matches.push({ distortion, weight: 0.8 });
        }
      }
    }

    // Default to All-or-Nothing or Catastrophizing if general negative words present
    if (matches.length === 0) {
      const lower = text.toLowerCase();
      if (lower.includes('never') || lower.includes('always') || lower.includes('failed') || lower.includes('hate')) {
        const d = this.getDistortionById('all_or_nothing');
        if (d) matches.push({ distortion: d, weight: 0.6 });
      } else if (lower.includes('worst') || lower.includes('disaster') || lower.includes('scared') || lower.includes('panic')) {
        const d = this.getDistortionById('catastrophizing');
        if (d) matches.push({ distortion: d, weight: 0.6 });
      }
    }

    const detected = matches.map((m) => m.distortion);
    const primary = detected.length > 0 ? detected[0] : null;

    let socraticPrompts: string[] = [];
    let reframingInsight = "Hold gentle space for what you are feeling.";
    let somaticCue = "Allow your shoulders to release down away from your ears.";
    let protocol: CBTProtocol | null = null;

    if (primary) {
      socraticPrompts = primary.socratic_questions;
      reframingInsight = primary.reframing_prompt;
      somaticCue = primary.somatic_anchor;
      protocol = this.getProtocolById(primary.recommended_protocol) || null;
    } else {
      socraticPrompts = [
        "What evidence supports this initial thought?",
        "If a dear friend told you this exact concern, how would you respond to them?"
      ];
    }

    return {
      detected_distortions: detected,
      primary_distortion: primary,
      socratic_prompts: socraticPrompts,
      reframing_insight: reframingInsight,
      recommended_protocol: protocol,
      somatic_cue: somaticCue,
      confidence_score: detected.length > 0 ? 0.85 : 0.4,
    };
  }

  /**
   * Replaces internal knowledge dataset (used by auto-upgrade subsystem).
   */
  public updateLibrary(newData: CBTLibraryData): void {
    if (!newData || !newData.manifest || !Array.isArray(newData.cognitive_distortions)) {
      throw new Error("Invalid CBT Library payload schema");
    }
    this.data = newData;
  }
}

export const cbtLibrary = new CBTLibraryEngine();
export default cbtLibrary;
