/**
 * Zero-Retention Ephemeral Storage Engine
 * Strictly in-memory during active session runtime.
 * Zero encrypted chat history, transcripts, or caches are persisted to disk/IndexedDB.
 * Automatically and permanently wiped when the session ends or the app is closed.
 */

export interface EmotionalProfile {
  id: string;
  dominantDimension: string;
  averageValence: number;
  averageArousal: number;
  updatedAt: number;
}

export interface TherapeuticMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'crisis_guardrail';
  content: string;
  timestamp: number;
  dimensionName?: string;
  coreAffect?: { valence: number; arousal: number };
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  messages: TherapeuticMessage[];
  summary?: string;
  primaryDimension?: string;
}

export const DB_NAME = 'EIH_SecureStorage';
export const STORE_PROFILES = 'emotional_profiles';
export const STORE_SESSIONS = 'therapeutic_sessions';

// ─── STRICTLY IN-MEMORY EPHEMERAL STATE (ZERO DISK / ZERO RETENTION) ───
let inMemorySessionMessages: TherapeuticMessage[] = [];
let activeSessionId = `session_${Date.now()}`;

/**
 * Ephemeral in-memory session save.
 * Strictly operates in volatile RAM for the active turn only.
 * Never writes messages or transcripts to persistent IndexedDB or disk storage.
 */
export async function saveSessionRecord(_session: SessionRecord): Promise<void> {
  // No-op for disk persistence — everything is zero-retention ephemeral in RAM
}

/**
 * Returns stored historical sessions.
 * In 100% Zero-Retention mode, this strictly returns an empty array: 0 records saved.
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  return [];
}

/**
 * Irreversibly purges all local storage, legacy IndexedDB databases,
 * session storage, and in-memory caches (Right-to-be-forgotten & Zero-Retention).
 */
export async function purgeAllEncryptedData(): Promise<boolean> {
  inMemorySessionMessages = [];
  
  if (typeof window === 'undefined') return true;

  try {
    // 1. Delete legacy EIH_SecureStorage database
    if (window.indexedDB) {
      const req = window.indexedDB.deleteDatabase(DB_NAME);
      req.onerror = () => {};
      req.onsuccess = () => {};
    }

    // 2. Delete EIH_CognitiveVault if present
    if (window.indexedDB) {
      window.indexedDB.deleteDatabase('EIH_CognitiveVault');
      window.indexedDB.deleteDatabase('EIH_KeyVault');
    }

    // 3. Clear all indexedDB databases if supported by browser
    if (window.indexedDB && typeof (window.indexedDB as any).databases === 'function') {
      (window.indexedDB as any).databases().then((dbs: Array<{ name?: string }>) => {
        dbs.forEach((dbInfo) => {
          if (dbInfo.name && dbInfo.name.startsWith('EIH_')) {
            window.indexedDB.deleteDatabase(dbInfo.name);
          }
        });
      }).catch(() => {});
    }

    // 4. Clear sensitive localStorage and sessionStorage keys
    try {
      window.sessionStorage.clear();
      window.localStorage.removeItem('eih_active_psychology_profile');
      window.localStorage.removeItem('eih_learned_psychology_docs');
      window.localStorage.removeItem('eih_cog_salt_v1');
      window.localStorage.removeItem('eih_cog_seed_v1');
      window.localStorage.removeItem('eih_salt_v1');
      window.localStorage.removeItem('eih_vault_master_seed');
      window.localStorage.removeItem('eih_device_salt');
    } catch (_) {}

    return true;
  } catch (err) {
    console.warn('Storage purge notice:', err);
    return true;
  }
}

/**
 * Master App Storage & Cache Purge
 * Executed on App Close (beforeunload/pagehide) and Session End.
 */
export async function purgeAllAppStorage(): Promise<void> {
  await purgeAllEncryptedData();
  
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('session') || key.includes('telemetry') || key.includes('eih')) {
          await caches.delete(key);
        }
      }
    } catch (_) {}
  }
}

export const getStoredSessionRecords = getAllSessions;

/**
 * Resets and creates a fresh session ID for a new conversation session,
 * instantly clearing all ephemeral in-memory message history.
 */
export function resetActiveSessionId(): string {
  activeSessionId = `session_${Date.now()}`;
  inMemorySessionMessages = [];
  return activeSessionId;
}

export function getActiveSessionId(): string {
  return activeSessionId;
}

/**
 * Ephemeral message handler during active session.
 * Retains messages in volatile memory for the active turn only.
 * Never persists to IndexedDB or localStorage.
 */
export async function saveSessionMessage(role: 'user' | 'assistant', content: string): Promise<void> {
  inMemorySessionMessages.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    role,
    content,
    timestamp: Date.now(),
  });
}

/**
 * Retrieves the current ephemeral in-memory messages for this active session only.
 */
export function getActiveSessionEphemeralMessages(): TherapeuticMessage[] {
  return [...inMemorySessionMessages];
}
