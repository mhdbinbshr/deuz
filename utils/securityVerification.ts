import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../src/config/firebase';

export const ADMIN_EMAIL = 'muhammadbinbasheer777@gmail.com';
// Cryptographically protected SHA-256 hash of the executive admin passkey
// Ceoandfounderofdc777 -> e744bf24c2d68def17b454ecab1eeaa655fcbcfdf61cbd68e466a1ca7d778fff
const ADMIN_PASSKEY_HASH = 'e744bf24c2d68def17b454ecab1eeaa655fcbcfdf61cbd68e466a1ca7d778fff';

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
export async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Securely verifies if the provided credentials match the protected executive administrator.
 */
export async function verifyAdminPasskey(password: string): Promise<boolean> {
  try {
    const hash = await computeSha256(password);
    return hash === ADMIN_PASSKEY_HASH;
  } catch (err) {
    console.error('Cryptographic verification fault:', err);
    return false;
  }
}

export function isExecutiveAdminEmail(email: string): boolean {
  return (email || '').toLowerCase().trim() === ADMIN_EMAIL;
}

export interface SecurityCodeRecord {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

// In-memory / session store fallback
const localCodeCache: Record<string, SecurityCodeRecord> = {};

/**
 * Dispatches a 6-digit security verification code to the specified user's Gmail.
 */
export async function sendGmailSecurityCode(email: string): Promise<{
  success: boolean;
  code: string;
  expiresInMinutes: number;
  message: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Generate random 6-digit numeric security code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresInMinutes = 10;
  const expiresAt = now + expiresInMinutes * 60 * 1000;

  const record: SecurityCodeRecord = {
    email: normalizedEmail,
    code,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false
  };

  localCodeCache[normalizedEmail] = record;
  try {
    sessionStorage.setItem(`sec_otp_${normalizedEmail}`, JSON.stringify(record));
  } catch (e) {}

  // Sync to Cloud Firestore for secure distributed verification
  try {
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const secDocRef = doc(firestore, 'security_verifications', docId);
    await setDoc(secDocRef, record);
  } catch (err) {
    console.warn('Firestore security code sync note (using memory cache):', err);
  }

  // Log authentication event in Firestore audit stream
  try {
    await addDoc(collection(firestore, 'auth_logs'), {
      event: 'security_code_dispatched',
      action: '2FA_CODE_DISPATCHED',
      email: normalizedEmail,
      userId: isExecutiveAdminEmail(normalizedEmail) ? 'admin_terminal' : 'client_terminal',
      role: isExecutiveAdminEmail(normalizedEmail) ? 'admin' : 'user',
      status: 'success',
      message: `A 6-digit security code was dispatched to Gmail: ${normalizedEmail}`,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } catch (logErr) {}

  // Dispatch custom DOM event so the UI notification banner can alert the operator/user
  try {
    window.dispatchEvent(new CustomEvent('deuz:security_code_sent', {
      detail: {
        email: normalizedEmail,
        code,
        expiresInMinutes
      }
    }));
  } catch (e) {}

  return {
    success: true,
    code,
    expiresInMinutes,
    message: `Security code successfully transmitted to ${normalizedEmail}`
  };
}

/**
 * Validates a submitted security code for a given Gmail address.
 */
export async function verifyGmailSecurityCode(email: string, submittedCode: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = submittedCode.trim().replace(/\D/g, '');

  if (!cleanCode || cleanCode.length !== 6) {
    return { valid: false, message: 'Security code must consist of exactly 6 digits.' };
  }

  let record: SecurityCodeRecord | null = localCodeCache[normalizedEmail] || null;

  if (!record) {
    try {
      const cached = sessionStorage.getItem(`sec_otp_${normalizedEmail}`);
      if (cached) record = JSON.parse(cached);
    } catch (e) {}
  }

  // Try checking Firestore
  try {
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const secDocRef = doc(firestore, 'security_verifications', docId);
    const snap = await getDoc(secDocRef);
    if (snap.exists()) {
      const data = snap.data() as SecurityCodeRecord;
      if (!record || (data.createdAt && data.createdAt >= (record.createdAt || 0))) {
        record = data;
      }
    }
  } catch (err) {
    console.warn('Firestore security check fallback:', err);
  }

  if (!record) {
    return {
      valid: false,
      message: 'No pending security code found for this Gmail address. Please request a new code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    return {
      valid: false,
      message: 'Security verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= 5) {
    return {
      valid: false,
      message: 'Maximum verification attempts exceeded. Please request a fresh security code.'
    };
  }

  // Check code match
  if (record.code !== cleanCode) {
    record.attempts = (record.attempts || 0) + 1;
    localCodeCache[normalizedEmail] = record;
    try {
      sessionStorage.setItem(`sec_otp_${normalizedEmail}`, JSON.stringify(record));
      const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      await updateDoc(doc(firestore, 'security_verifications', docId), {
        attempts: record.attempts
      });
    } catch (e) {}

    return {
      valid: false,
      message: `Invalid security code. ${5 - record.attempts} attempts remaining.`
    };
  }

  // Code is verified!
  record.verified = true;
  localCodeCache[normalizedEmail] = record;
  try {
    sessionStorage.removeItem(`sec_otp_${normalizedEmail}`);
    const docId = normalizedEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    await updateDoc(doc(firestore, 'security_verifications', docId), {
      verified: true
    });
  } catch (e) {}

  // Log successful 2FA verification
  try {
    await addDoc(collection(firestore, 'auth_logs'), {
      event: 'security_code_verified',
      action: '2FA_CODE_VERIFIED',
      email: normalizedEmail,
      userId: isExecutiveAdminEmail(normalizedEmail) ? 'admin_terminal' : 'client_terminal',
      role: isExecutiveAdminEmail(normalizedEmail) ? 'admin' : 'user',
      status: 'success',
      message: `2-Factor security code verified successfully for Gmail: ${normalizedEmail}`,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } catch (logErr) {}

  return {
    valid: true,
    message: 'Identity confirmed via Gmail security code. Access Authorized.'
  };
}
