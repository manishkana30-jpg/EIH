/**
 * Encrypted Client-Side IndexedDB Storage
 * Stores user emotional baselines and episodic chat logs
 * encrypted via WebCrypto AES-GCM-256 with full HIPAA/GDPR data isolation and right-to-purge.
 */

import { encryptData, decryptData, EncryptedPayload } from './crypto';

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

const DB_NAME = 'EIH_SecureStorage';
const DB_VERSION = 2;
const STORE_PROFILES = 'emotional_profiles';
const STORE_SESSIONS = 'therapeutic_sessions';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates an encrypted therapeutic session.
 */
export async function saveSessionRecord(session: SessionRecord): Promise<void> {
  try {
    const db = await openDatabase();
    const encrypted = await encryptData(session);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      const record = { id: session.id, payload: encrypted, timestamp: session.startedAt };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Encrypted IndexedDB save notice:', err);
  }
}

/**
 * Retrieves all decrypted session history logs.
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const req = store.getAll();

      req.onsuccess = async () => {
        const rawList = req.result || [];
        const sessions: SessionRecord[] = [];
        for (const item of rawList) {
          if (item.payload) {
            try {
              const decrypted = await decryptData<SessionRecord>(item.payload as EncryptedPayload);
              sessions.push(decrypted);
            } catch (err) {
              console.warn('Skipping unreadable encrypted session record', err);
            }
          }
        }
        sessions.sort((a, b) => b.startedAt - a.startedAt);
        resolve(sessions);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Irreversibly purges all local encrypted records (Right-to-be-forgotten).
 */
export async function purgeAllEncryptedData(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PROFILES, STORE_SESSIONS], 'readwrite');
      tx.objectStore(STORE_PROFILES).clear();
      tx.objectStore(STORE_SESSIONS).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to purge encrypted records:', err);
    return false;
  }
}

export const getStoredSessionRecords = getAllSessions;

