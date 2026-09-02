/**
 * lib/services/cbt-upgrader.ts
 * Frontend Client for CBT Knowledge Base Auto-Upgrade and Dynamic Distortion Querying.
 */

import { cbtLibrary, CBTLibraryData, CBTDistortion, CBTProtocol, CBTAnalysisResult } from '../knowledge/cbt-library';

export interface UpgradeStatusResponse {
  success: boolean;
  status: string;
  previous_version: string;
  current_version: string;
  checksum_sha256: string;
  details: string;
  timestamp: string;
  can_rollback?: boolean;
}

const getApiBase = () => {
  const publicUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL);
  return publicUrl ? `${publicUrl.replace(/\/$/, '')}/api` : '/api/py';
};

class CBTUpgraderService {
  /**
   * Fetches active CBT Library manifest and data from the backend or falls back to bundled static data.
   */
  public async getLibraryData(): Promise<CBTLibraryData> {
    try {
      const res = await fetch(`${getApiBase()}/cbt/library`);
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData?.manifest?.version) {
          cbtLibrary.updateLibrary(remoteData);
          return remoteData;
        }
      }
    } catch {
      // Fallback to locally loaded bundled library
    }

    return {
      manifest: cbtLibrary.getManifest(),
      cognitive_distortions: cbtLibrary.getAllDistortions(),
      maladaptive_schemas: cbtLibrary.getAllSchemas(),
      clinical_protocols: cbtLibrary.getAllProtocols(),
    };
  }

  /**
   * Analyzes an utterance for cognitive distortions via backend or local heuristic engine.
   */
  public async analyzeUtterance(text: string): Promise<CBTAnalysisResult> {
    try {
      const res = await fetch(`${getApiBase()}/cbt/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.primary_distortion_id) {
          const matched = cbtLibrary.getDistortionById(data.primary_distortion_id);
          return {
            detected_distortions: matched ? [matched] : [],
            primary_distortion: matched || null,
            socratic_prompts: data.socratic_prompts || [],
            reframing_insight: data.reframing_insight || '',
            recommended_protocol: cbtLibrary.getProtocolById(data.recommended_protocol) || null,
            somatic_cue: data.somatic_cue || '',
            confidence_score: data.confidence_score || 0.8,
          };
        }
      }
    } catch {
      // Fallback to client-side heuristic engine
    }

    return cbtLibrary.analyzeUtterance(text);
  }

  /**
   * Triggers the automated CBT library upgrade pipeline.
   */
  public async triggerUpgrade(customPayload?: Partial<CBTLibraryData>): Promise<UpgradeStatusResponse> {
    try {
      const res = await fetch(`${getApiBase()}/cbt/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: customPayload || null, force: true }),
      });

      if (res.ok) {
        const result: UpgradeStatusResponse = await res.json();
        // Refresh local cache
        await this.getLibraryData();
        return result;
      }
      const err = await res.json();
      return {
        success: false,
        status: 'error',
        previous_version: cbtLibrary.getManifest().version,
        current_version: cbtLibrary.getManifest().version,
        checksum_sha256: '',
        details: err.detail || 'Upgrade request failed',
        timestamp: new Date().toISOString(),
        can_rollback: false,
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'network_error',
        previous_version: cbtLibrary.getManifest().version,
        current_version: cbtLibrary.getManifest().version,
        checksum_sha256: '',
        details: e?.message || 'Network connection failed during upgrade',
        timestamp: new Date().toISOString(),
        can_rollback: false,
      };
    }
  }

  /**
   * Triggers rollback to the previous stable snapshot.
   */
  public async triggerRollback(): Promise<UpgradeStatusResponse> {
    try {
      const res = await fetch(`${getApiBase()}/cbt/rollback`, { method: 'POST' });
      if (res.ok) {
        const result: UpgradeStatusResponse = await res.json();
        await this.getLibraryData();
        return result;
      }
      return {
        success: false,
        status: 'error',
        previous_version: 'unknown',
        current_version: 'unknown',
        checksum_sha256: '',
        details: 'Rollback endpoint returned error',
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'network_error',
        previous_version: 'unknown',
        current_version: 'unknown',
        checksum_sha256: '',
        details: e?.message || 'Rollback connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const cbtUpgraderService = new CBTUpgraderService();
export default cbtUpgraderService;
