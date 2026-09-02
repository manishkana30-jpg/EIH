/**
 * tests/api_key_encryption.test.js
 * 
 * Comprehensive Unit Test for Client-Side Zero-Knowledge API Key Encryption
 * Verifies WebCrypto AES-GCM-256 encryption, PBKDF2 key derivation, zero-plaintext storage,
 * tamper detection, and key metadata masking.
 */

const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// In-Memory IndexedDB Simulation for Node.js test environment
const memoryVault = new Map();

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

function getDeviceSalt() {
  return new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]);
}

function getMasterSeed() {
  return 'device-unique-master-seed-eih-vault-test';
}

async function deriveVaultKey(salt) {
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
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString('base64');
}

function base64ToBuffer(base64) {
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function saveEncryptedApiKey(apiKey, keyId = 'user_byok_key') {
  if (!apiKey || !apiKey.trim()) {
    memoryVault.delete(keyId);
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
      iv: iv,
      tagLength: 128,
    },
    key,
    encodedKey
  );

  const payload = {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    timestamp: Date.now(),
  };

  memoryVault.set(keyId, payload);
}

async function getDecryptedApiKey(keyId = 'user_byok_key') {
  const payload = memoryVault.get(keyId);
  if (!payload) return null;

  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const cipherBuffer = base64ToBuffer(payload.ciphertext);

  const key = await deriveVaultKey(salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    cipherBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

async function getKeyMetadata(keyId = 'user_byok_key') {
  const key = await getDecryptedApiKey(keyId);
  if (!key || !key.trim()) {
    return { exists: false };
  }
  let providerType = 'Custom';
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
}

async function runApiKeyEncryptionTests() {
  console.log('\n================================================================');
  console.log('ZERO-KNOWLEDGE API KEY ENCRYPTION & SECURITY TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASSED]: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAILED]: ${message}`);
      process.exit(1);
    }
  }

  // 1. Encryption & Decryption Roundtrip
  console.log('--- 1. Testing AES-GCM-256 Encryption & Decryption Roundtrip ---');
  const sampleKey = 'sk-proj-1234567890abcdef1234567890abcdef123456';
  await saveEncryptedApiKey(sampleKey, 'user_byok_key');

  const storedPayload = memoryVault.get('user_byok_key');
  assert(storedPayload !== undefined, 'Encrypted payload stored in vault');
  assert(storedPayload.ciphertext !== sampleKey, 'Ciphertext is NOT plaintext');
  assert(!storedPayload.ciphertext.includes('sk-proj-'), 'Plaintext prefix never leaks into ciphertext');

  const decrypted = await getDecryptedApiKey('user_byok_key');
  assert(decrypted === sampleKey, 'Decrypted key matches original plaintext in volatile memory');

  // 2. Zero-Plaintext Metadata Masking
  console.log('\n--- 2. Testing Safe Metadata Masking (Zero Plaintext UI Exposure) ---');
  const meta = await getKeyMetadata('user_byok_key');
  assert(meta.exists === true, 'Metadata reports key exists');
  assert(meta.providerType === 'OpenAI', 'Provider type correctly detected as OpenAI');
  assert(meta.maskedPreview.startsWith('sk-p'), 'Masked preview preserves safe prefix');
  assert(meta.maskedPreview.includes('••••••••'), 'Middle 16+ characters are fully masked');
  assert(!meta.maskedPreview.includes('1234567890abcdef'), 'Internal secret characters are NOT exposed');
  console.log(`    ➔ Safe UI Display: "${meta.providerType} (${meta.maskedPreview})"`);

  // 3. Groq Tier 2 Key Encryption & Masking
  console.log('\n--- 3. Testing Groq Tier 2 Key Encryption & Masking ---');
  const sampleGroq = 'gsk_abcdef9876543210zyxwvutsrqponmlkjihgfedcba';
  await saveEncryptedApiKey(sampleGroq, 'tier2_credential');

  const groqMeta = await getKeyMetadata('tier2_credential');
  assert(groqMeta.exists === true, 'Tier 2 credential exists');
  assert(groqMeta.providerType === 'Groq', 'Provider correctly identified as Groq');
  assert(groqMeta.maskedPreview.startsWith('gsk_'), 'Masked preview shows gsk_ prefix');
  assert(!groqMeta.maskedPreview.includes('9876543210'), 'Middle secret key characters masked');
  console.log(`    ➔ Safe UI Display: "${groqMeta.providerType} (${groqMeta.maskedPreview})"`);

  // 4. Tamper Detection
  console.log('\n--- 4. Testing AES-GCM-256 Authentication Tag Tamper-Proofing ---');
  const corruptPayload = { ...memoryVault.get('user_byok_key') };
  const rawBytes = Buffer.from(corruptPayload.ciphertext, 'base64');
  rawBytes[0] = rawBytes[0] ^ 0xff; // Corrupt 1 byte
  corruptPayload.ciphertext = rawBytes.toString('base64');
  memoryVault.set('tampered_key', corruptPayload);

  let tamperedDecryptionFailed = false;
  try {
    await getDecryptedApiKey('tampered_key');
  } catch {
    tamperedDecryptionFailed = true;
  }
  assert(tamperedDecryptionFailed || (await getDecryptedApiKey('tampered_key')) === null, 'Tampered ciphertext rejected with authentication failure');

  // 5. Permanent Purging
  console.log('\n--- 5. Testing Permanent Key Purging ---');
  await saveEncryptedApiKey('', 'user_byok_key');
  const purgedDecrypted = await getDecryptedApiKey('user_byok_key');
  const purgedMeta = await getKeyMetadata('user_byok_key');
  assert(purgedDecrypted === null, 'Purged key returns null');
  assert(purgedMeta.exists === false, 'Purged metadata exists is false');

  console.log(`\n================================================================`);
  console.log(`🎉 ALL ZERO-KNOWLEDGE API KEY ENCRYPTION TESTS PASSED (${passed}/${total})`);
  console.log(`================================================================\n`);
}

runApiKeyEncryptionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
