/**
 * Unit Test Suite: WebCrypto AES-GCM-256 & PCM Audio Conversion
 */

const assert = require('assert');
const crypto = require('crypto');

function simulateFloat32ToInt16PCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return int16Array;
}

function encryptAESGCM(plainText, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decryptAESGCM(encryptedPayload, passphrase) {
  const salt = Buffer.from(encryptedPayload.salt, 'hex');
  const iv = Buffer.from(encryptedPayload.iv, 'hex');
  const tag = Buffer.from(encryptedPayload.tag, 'hex');
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedPayload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function runCryptoAndAudioTests() {
  console.log('--- Running WebCrypto AES-GCM-256 & Audio PCM Pipeline Tests ---');

  // 1. Test PCM Buffer Conversion
  const float32Samples = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]);
  const pcmInt16 = simulateFloat32ToInt16PCM(float32Samples);

  assert.strictEqual(pcmInt16[0], 0, 'Zero sample must be 0');
  assert.strictEqual(pcmInt16[3], 32767, 'Max sample must be 32767');
  assert.strictEqual(pcmInt16[4], -32768, 'Min sample must be -32768');
  assert.strictEqual(pcmInt16[5], 32767, 'Clipped positive sample must be 32767');
  assert.strictEqual(pcmInt16[6], -32768, 'Clipped negative sample must be -32768');
  console.log('  ✓ Float32 -> Int16 PCM AudioWorklet conversion verified');

  // 2. Test AES-GCM-256 Encryption & Decryption Roundtrip
  const testData = JSON.stringify({
    prakriti: { vata: 40, pitta: 40, kapha: 20, primaryDosha: 'Vata-Pitta' },
    sensitivities: ['sensory_overload', 'circadian_shift'],
    transcript: "Feeling calm after Nadi Shodhana breathwork"
  });
  const passphrase = "eih-secure-master-key-2026";

  const encrypted = encryptAESGCM(testData, passphrase);
  assert(encrypted.ciphertext.length > 0, 'Ciphertext must not be empty');
  assert.strictEqual(encrypted.iv.length, 24, 'IV hex must be 12 bytes (24 hex chars)');

  const decrypted = decryptAESGCM(encrypted, passphrase);
  assert.strictEqual(decrypted, testData, 'Decrypted payload must match original data');
  console.log('  ✓ WebCrypto AES-GCM-256 zero-knowledge encryption/decryption roundtrip verified');

  // 3. Test Tamper Resistance (Authentication Tag validation)
  const flippedChar = encrypted.ciphertext[0] === 'a' ? 'b' : 'a';
  let tampered = { ...encrypted, ciphertext: flippedChar + encrypted.ciphertext.slice(1) };
  let threw = false;
  try {
    decryptAESGCM(tampered, passphrase);
  } catch (err) {
    threw = true;
  }
  assert.strictEqual(threw, true, 'Tampered ciphertext must fail authentication tag check');
  console.log('  ✓ AES-GCM-256 Authentication Tag Tamper-Proofing verified');

  console.log('\nAudio & Crypto Tests: All Passed Successfully!\n');
}

module.exports = { runCryptoAndAudioTests };

if (require.main === module) {
  runCryptoAndAudioTests();
}
