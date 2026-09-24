/**
 * lib/wellness-flow/storage-encryption.ts
 *
 * Zero-Knowledge Client-Side AES-GCM-256 Storage Encryption for Wellness Flow.
 * Encrypts all stored psychological mood profiles, CBT thoughts, and session state.
 * Manages explicit microphone consent tracking.
 */

import { encryptData, decryptData, type EncryptedPayload } from '../db/crypto.ts';
import type { PersistentSessionData } from './types';

const WELLNESS_SESSION_STORAGE_KEY = 'eih_wellness_session_encrypted';
const MIC_CONSENT_KEY = 'eih_mic_consent_granted';

export function getMicConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MIC_CONSENT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMicConsent(consent: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MIC_CONSENT_KEY, consent ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to store mic consent preference:', err);
  }
}

/**
 * Encrypts and persists the active 4-phase wellness session to localStorage.
 */
export async function saveEncryptedWellnessSession(session: PersistentSessionData): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const payload = await encryptData<PersistentSessionData>(session);
    localStorage.setItem(WELLNESS_SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to encrypt wellness session data:', err);
  }
}

/**
 * Loads and decrypts the persistent wellness session from localStorage.
 */
export async function loadEncryptedWellnessSession(): Promise<PersistentSessionData | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WELLNESS_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as EncryptedPayload;
    const decrypted = await decryptData<PersistentSessionData>(payload);
    return decrypted;
  } catch (err) {
    console.warn('Failed to decrypt saved wellness session:', err);
    return null;
  }
}

/**
 * Clears stored encrypted session data on session end or reset.
 */
export function clearEncryptedWellnessSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WELLNESS_SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear encrypted wellness session:', err);
  }
}
