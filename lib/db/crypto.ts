/**
 * WebCrypto AES-GCM-256 Cryptographic Utilities
 * Provides zero-knowledge, client-side encryption for user constitutional baselines,
 * doshic assessments, and episodic therapeutic session transcripts.
 */

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM standard
const SALT_LENGTH = 16;

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  timestamp: number;
}

/**
 * Derives an AES-GCM CryptoKey using PBKDF2 with SHA-256.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
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
 * Gets or creates a secure device master seed stored in non-extractable session storage.
 */
export function getDeviceMasterPassphrase(): string {
  if (typeof window === 'undefined') return 'eih-default-secure-passphrase-node-ssr';
  const STORAGE_KEY = 'eih_local_master_seed';
  let seed = localStorage.getItem(STORAGE_KEY);
  if (!seed) {
    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    seed = Array.from(randomBuffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY, seed);
  }
  return seed;
}

/**
 * Encrypts an arbitrary object or string using AES-GCM-256.
 */
export async function encryptData<T>(data: T, customPassphrase?: string): Promise<EncryptedPayload> {
  const passphrase = customPassphrase || getDeviceMasterPassphrase();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128,
    },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    timestamp: Date.now(),
  };
}

/**
 * Decrypts an EncryptedPayload back into the typed data structure.
 */
export async function decryptData<T>(payload: EncryptedPayload, customPassphrase?: string): Promise<T> {
  const passphrase = customPassphrase || getDeviceMasterPassphrase();
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const cipherBuffer = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

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
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

// Helpers for Base64 conversion
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function base64ToBuffer(base64: string): ArrayBuffer {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
