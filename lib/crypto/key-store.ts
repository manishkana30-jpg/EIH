/**
 * Client-Side Zero-Knowledge BYOK Key Store
 * Uses native WebCrypto API (AES-GCM-256) with PBKDF2 (SHA-256, 100,000 iterations)
 * to securely store user API keys in IndexedDB without exposing them to remote databases.
 */

const DB_NAME = 'EIH_KeyVault';
const DB_VERSION = 1;
const STORE_NAME = 'byok_vault';
const KEY_RECORD_ID = 'user_byok_key';
const PBKDF2_ITERATIONS = 310000; // OWASP 2024 recommendation
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for standard AES-GCM
const SALT_LENGTH = 16;

export interface EncryptedKeyPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  salt: string;       // Base64
  timestamp: number;
}

/**
 * Gets or creates a stable device-specific salt for key derivation.
 */
function getDeviceSalt(): Uint8Array {
  if (typeof window === 'undefined') {
    return new Uint8Array([12, 45, 78, 90, 23, 56, 89, 12, 34, 67, 89, 10, 45, 78, 12, 99]);
  }
  const SALT_STORAGE_KEY = 'eih_device_salt_v1';
  let stored = localStorage.getItem(SALT_STORAGE_KEY);
  if (!stored) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    stored = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(SALT_STORAGE_KEY, stored);
  }
  const match = stored.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map((byte) => parseInt(byte, 16)) : [1, 2, 3, 4]);
}

/**
 * Gets or initializes the device master passphrase seed.
 */
function getMasterSeed(): string {
  if (typeof window === 'undefined') return 'eih-ssr-node-default-seed';
  const SEED_STORAGE_KEY = 'eih_master_seed_v1';
  let seed = localStorage.getItem(SEED_STORAGE_KEY);
  if (!seed) {
    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    seed = Array.from(randomBuffer, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(SEED_STORAGE_KEY, seed);
  }
  return seed;
}

/**
 * Derives an AES-GCM CryptoKey using PBKDF2 with SHA-256.
 */
async function deriveVaultKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const seed = getMasterSeed();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(seed),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
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
}

/**
 * Opens IndexedDB database for key storage.
 */
function openKeyVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helpers for Base64 conversion
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
 * Encrypts and securely persists the user's BYOK API key or credential in IndexedDB.
 */
export async function saveEncryptedApiKey(apiKey: string, keyId: string = KEY_RECORD_ID): Promise<void> {
  if (!apiKey || !apiKey.trim()) {
    await clearUserApiKey(keyId);
    return;
  }

  const salt = getDeviceSalt();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveVaultKey(salt);

  const enc = new TextEncoder();
  const encodedKey = enc.encode(apiKey.trim());

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128,
    },
    key,
    encodedKey
  );

  const payload: EncryptedKeyPayload = {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    timestamp: Date.now(),
  };

  const db = await openKeyVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id: keyId, payload });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Decrypts the stored BYOK API key from IndexedDB into volatile memory.
 */
export async function getDecryptedApiKey(keyId: string = KEY_RECORD_ID): Promise<string | null> {
  try {
    const db = await openKeyVaultDB();
    const payload: EncryptedKeyPayload | null = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(keyId);
      req.onsuccess = () => {
        if (req.result && req.result.payload) {
          resolve(req.result.payload as EncryptedKeyPayload);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });

    if (!payload) return null;

    const salt = new Uint8Array(base64ToBuffer(payload.salt));
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const cipherBuffer = base64ToBuffer(payload.ciphertext);

    const key = await deriveVaultKey(salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        tagLength: 128,
      },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Notice: Unable to decrypt stored BYOK API key:', err);
    return null;
  }
}

/**
 * Irreversibly purges the user's stored BYOK API key from IndexedDB.
 */
export async function clearUserApiKey(keyId: string = KEY_RECORD_ID): Promise<void> {
  try {
    const db = await openKeyVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(keyId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Notice: Error clearing user API key from IndexedDB:', err);
  }
}

/**
 * Checks if a BYOK API key is currently encrypted and stored.
 */
export async function hasStoredApiKey(keyId: string = KEY_RECORD_ID): Promise<boolean> {
  try {
    const key = await getDecryptedApiKey(keyId);
    return !!key && key.trim().length > 0;
  } catch {
    return false;
  }
}

export interface KeyMetadata {
  exists: boolean;
  providerType?: 'OpenAI' | 'Anthropic' | 'Gemini' | 'Groq' | 'LiveKit' | 'Custom';
  maskedPreview?: string;
  timestamp?: number;
}

/**
 * Returns safe metadata (provider type and masked preview) without exposing plaintext key.
 */
export async function getKeyMetadata(keyId: string = KEY_RECORD_ID): Promise<KeyMetadata> {
  try {
    const key = await getDecryptedApiKey(keyId);
    if (!key || !key.trim()) {
      return { exists: false };
    }
    let providerType: KeyMetadata['providerType'] = 'Custom';
    if (key.startsWith('sk-proj-') || key.startsWith('sk-')) providerType = 'OpenAI';
    else if (key.startsWith('sk-ant-')) providerType = 'Anthropic';
    else if (key.startsWith('AIzaSy') || key.startsWith('AIza')) providerType = 'Gemini';
    else if (key.startsWith('gsk_')) providerType = 'Groq';
    else if (key.startsWith('wss://') || key.startsWith('ws://')) providerType = 'LiveKit';

    const maskedPreview = key.length > 8 ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : '••••••••';
    return {
      exists: true,
      providerType,
      maskedPreview,
    };
  } catch {
    return { exists: false };
  }
}
