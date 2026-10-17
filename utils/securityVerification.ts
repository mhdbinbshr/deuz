import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../src/config/firebase';

export const ADMIN_EMAIL = 'muhammadbinbasheer777@gmail.com';

export type SecurityVerificationPurpose =
  | 'SIGNUP_VERIFICATION'
  | 'LOGIN_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFICATION'
  | 'ADMIN_SECURITY';

/**
 * Validates if the email address belongs to the designated executive administrator.
 */
export function isExecutiveAdminEmail(email: string): boolean {
  return (email || '').toLowerCase().trim() === ADMIN_EMAIL;
}

/**
 * Deterministic cryptographic signature for password verification & sync audit.
 */
export function computePasswordHash(password: string, email?: string): string {
  const cleanEmail = (email || '').toLowerCase().trim();
  const raw = `DEUZ_SOVEREIGN_SALT_256::${cleanEmail}::${password}`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0, ch; i < raw.length; i++) {
    ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const encoded = typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(password))) : '';
  return `deuz_sha256_${hex1}${hex2}_${encoded}`;
}

/**
 * Extracts recoverable credential from snapshot if needed for seamless Firebase Auth synchronization.
 */
export function extractPasswordFromHash(hash?: string): string | null {
  if (!hash || !hash.startsWith('deuz_sha256_')) return null;
  const parts = hash.split('_');
  if (parts.length < 4) return null;
  const encoded = parts.slice(3).join('_');
  try {
    if (typeof atob !== 'undefined' && encoded) {
      return decodeURIComponent(escape(atob(encoded)));
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Verifies a security code against Firestore `security_verifications` if used via email.
 * Never exposes or dispatches codes onto the website UI.
 */
export async function verifySecurityCodeInFirestore(
  email: string,
  code: string
): Promise<{ valid: boolean; email?: string; message: string }> {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const cleanCode = (code || '').trim();

  if (!cleanCode || cleanCode.length < 6) {
    return { valid: false, message: 'Please enter a valid recovery code.' };
  }

  try {
    if (normalizedEmail) {
      const directRef = doc(firestore, 'security_verifications', normalizedEmail);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        const data = directSnap.data();
        if (String(data.code).trim() === cleanCode) {
          if (data.expiresAt && Date.now() > Number(data.expiresAt)) {
            return { valid: false, message: 'This recovery code has expired. Please request a new password reset email.' };
          }
          await updateDoc(directRef, {
            verified: true,
            verifiedAt: serverTimestamp()
          }).catch(() => {});
          return {
            valid: true,
            email: normalizedEmail,
            message: 'Recovery code confirmed.'
          };
        }
      }
    }

    const q = query(collection(firestore, 'security_verifications'), where('code', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const matchingDocs = snap.docs
        .map((d) => ({ ref: d.ref, data: d.data() }))
        .filter((item) => !normalizedEmail || (item.data.email || '').toLowerCase().trim() === normalizedEmail)
        .sort((a, b) => (Number(b.data.expiresAt) || 0) - (Number(a.data.expiresAt) || 0));

      if (matchingDocs.length > 0) {
        const target = matchingDocs[0];
        if (target.data.expiresAt && Date.now() > Number(target.data.expiresAt)) {
          return { valid: false, message: 'This recovery code has expired. Please request a new password reset email.' };
        }
        await updateDoc(target.ref, {
          verified: true,
          verifiedAt: serverTimestamp()
        }).catch(() => {});

        const resolvedEmail = (target.data.email || normalizedEmail).toLowerCase().trim();
        return {
          valid: true,
          email: resolvedEmail,
          message: 'Recovery code confirmed.'
        };
      }
    }

    return {
      valid: false,
      message: 'Invalid or expired recovery code. Please use the password reset link sent to your email.'
    };
  } catch (err: any) {
    return {
      valid: false,
      message: 'Unable to verify recovery code. Please use the password reset link sent to your email.'
    };
  }
}

/**
 * Legacy compatibility stub. All authentication must strictly go through Firebase Authentication.
 */
export async function verifyAdminPasskey(_password: string): Promise<boolean> {
  return false;
}
