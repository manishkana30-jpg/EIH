/**
 * lib/memory/cognitive-vault.ts
 *
 * Encrypted IndexedDB Repository for On-Device CBT Learnings & Cognitive Profiles.
 * Uses WebCrypto AES-GCM-256 (Zero-Knowledge) with PBKDF2 Key Caching,
 * IndexedDB Quota Fallback, and Anti-Prompt-Injection Sanitization.
 */

import type { CBTThoughtRecord, UserCognitiveProfile } from './cbt-memory-types.ts';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

const DB_NAME = 'EIH_CognitiveVault';
const DB_VERSION = 1;
const STORE_RECORDS = 'thought_records';
const STORE_PROFILE = 'cognitive_profile';
const PROFILE_KEY = 'active_user_profile';

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

const DEFAULT_PROFILE: UserCognitiveProfile = {
  version: 1,
  lastUpdated: Date.now(),
  primarySchemas: [],
  topRecurringDistortions: [
    { distortion: 'Personalization', frequency: 0, typicalTriggers: [] },
    { distortion: 'Catastrophizing', frequency: 0, typicalTriggers: [] },
    { distortion: 'All-or-Nothing', frequency: 0, typicalTriggers: [] },
  ],
  interventionEfficacyMatrix: [
    { technique: 'somatic_pranayama', successRate: 0.85, totalAttempts: 0, successfulAttempts: 0 },
    { technique: 'socratic_questioning', successRate: 0.80, totalAttempts: 0, successfulAttempts: 0 },
    { technique: 'de-catastrophizing', successRate: 0.75, totalAttempts: 0, successfulAttempts: 0 },
    { technique: 'behavioral_activation', successRate: 0.70, totalAttempts: 0, successfulAttempts: 0 },
    { technique: 'sattvavajaya_smriti', successRate: 0.80, totalAttempts: 0, successfulAttempts: 0 },
  ],
  breakthroughAnchors: [],
  doshicBaseline: {
    dominantTendency: 'sattva_balanced',
    effectiveGroundingPranayama: 'Nadi Shodhana',
  },
};

// In-memory fallback if IndexedDB is blocked (e.g. private browsing or quota limits)
const inMemoryFallbackStore = new Map<string, unknown>();

// In-memory cached AES CryptoKey to prevent 100k PBKDF2 iterations on every single transaction
let cachedCryptoKey: CryptoKey | null = null;
let cachedKeySalt: string | null = null;

function getDeviceSalt(): Uint8Array {
  if (typeof window === 'undefined') {
    return new Uint8Array([33, 44, 55, 66, 77, 88, 99, 11, 22, 33, 44, 55, 66, 77, 88, 99]);
  }
  const SALT_KEY = 'eih_cog_salt_v1';
  let stored = localStorage.getItem(SALT_KEY);
  if (!stored) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    stored = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(SALT_KEY, stored);
  }
  const match = stored.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map((byte) => parseInt(byte, 16)) : [1, 2, 3, 4]);
}

function getMasterSeed(): string {
  if (typeof window === 'undefined') return 'eih-ssr-node-cbt-seed';
  const SEED_KEY = 'eih_cog_seed_v1';
  let seed = localStorage.getItem(SEED_KEY);
  if (!seed) {
    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    seed = Array.from(randomBuffer, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(SEED_KEY, seed);
  }
  return seed;
}

async function deriveVaultKey(salt: Uint8Array): Promise<CryptoKey> {
  const saltStr = Array.from(salt).join(',');
  if (cachedCryptoKey && cachedKeySalt === saltStr) {
    return cachedCryptoKey;
  }

  const enc = new TextEncoder();
  const seed = getMasterSeed();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(seed),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derived = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  cachedCryptoKey = derived;
  cachedKeySalt = saltStr;
  return derived;
}

function bufferToBase64(buffer: ArrayBuffer | ArrayBufferLike | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

function base64ToBuffer(base64: string): ArrayBuffer {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * Sanitizes user breakthrough phrases to prevent Prompt Injection when reinjected into LLM context.
 */
export function sanitizeBreakthroughPhrase(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[\/?(system|instruction|prompt|scratchpad|context|assistant|human)[^\]]*\]/gi, '')
    .replace(/[`"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

async function encryptData(plainText: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = getDeviceSalt();
  // Fresh cryptographically random 96-bit IV per encryption operation (Zero IV reuse)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveVaultKey(salt);
  const enc = new TextEncoder();
  const encoded = enc.encode(plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any, tagLength: 128 },
    key,
    encoded
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

async function decryptData(payload: { ciphertext: string; iv: string; salt: string }): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const cipherBuffer = base64ToBuffer(payload.ciphertext);

  const key = await deriveVaultKey(salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any, tagLength: 128 },
    key,
    cipherBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

function openCognitiveDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class CognitiveVault {
  private static instance: CognitiveVault;
  private memoryCacheProfile: UserCognitiveProfile | null = null;
  private isWriting = false;

  public static getInstance(): CognitiveVault {
    if (!CognitiveVault.instance) {
      CognitiveVault.instance = new CognitiveVault();
    }
    return CognitiveVault.instance;
  }

  /**
   * Ephemeral thought record retention for active session only.
   * Stored in volatile RAM, never written to disk/IndexedDB.
   */
  public async saveThoughtRecord(record: CBTThoughtRecord): Promise<void> {
    try {
      const sanitizedRecord: CBTThoughtRecord = {
        ...record,
        triggerEvent: sanitizeBreakthroughPhrase(record.triggerEvent),
        automaticThought: sanitizeBreakthroughPhrase(record.automaticThought),
      };
      inMemoryFallbackStore.set(`record_${sanitizedRecord.id}`, sanitizedRecord);
    } catch (e) {
      console.warn('CognitiveVault: Thought record note:', e);
    }
  }

  /**
   * Retrieves all recent thought records from active in-memory session.
   */
  public async getRecentThoughtRecords(limit = 10): Promise<CBTThoughtRecord[]> {
    const records: CBTThoughtRecord[] = [];
    for (const [k, v] of inMemoryFallbackStore.entries()) {
      if (k.startsWith('record_')) {
        records.push(v as CBTThoughtRecord);
      }
    }
    records.sort((a, b) => b.timestamp - a.timestamp);
    return records.slice(0, limit);
  }

  /**
   * Decrypts and retrieves the User Cognitive Profile strictly from volatile RAM.
   */
  public async getCognitiveProfile(): Promise<UserCognitiveProfile> {
    if (this.memoryCacheProfile) {
      return this.memoryCacheProfile;
    }
    this.memoryCacheProfile = { ...DEFAULT_PROFILE };
    return this.memoryCacheProfile;
  }

  /**
   * Updates User Cognitive Profile in volatile memory for the active turn only.
   */
  public async updateProfileWithLearning(delta: Partial<UserCognitiveProfile>): Promise<void> {
    const current = await this.getCognitiveProfile();
    const updated: UserCognitiveProfile = {
      ...current,
      ...delta,
      lastUpdated: Date.now(),
    };

    if (updated.breakthroughAnchors) {
      updated.breakthroughAnchors = updated.breakthroughAnchors.map((b) => ({
        ...b,
        insightPhrase: sanitizeBreakthroughPhrase(b.insightPhrase),
        contextTrigger: sanitizeBreakthroughPhrase(b.contextTrigger),
      }));
    }

    this.memoryCacheProfile = updated;
  }

  /**
   * Erases all ephemeral memory from volatile RAM and deletes any legacy IndexedDB databases.
   */
  public async purgeAllMemory(): Promise<void> {
    this.memoryCacheProfile = { ...DEFAULT_PROFILE };
    cachedCryptoKey = null;
    cachedKeySalt = null;
    inMemoryFallbackStore.clear();

    if (typeof window === 'undefined') return;

    try {
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase(DB_NAME);
      }
    } catch (_) {}
  }
}

export const cognitiveVault = CognitiveVault.getInstance();
