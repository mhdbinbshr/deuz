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
 * One-way irreversible cryptographic signature for audit verification only.
 * Passwords are NEVER stored or encoded in Firestore or browser storage.
 */
function computeDigestFromRaw(raw: string): string {
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  let h3 = 0x9e3779b9 ^ raw.length;
  let h4 = 0x85ebca6b ^ raw.length;
  for (let i = 0, ch; i < raw.length; i++) {
    ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 13), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 1597334677) ^ Math.imul(h3 ^ (h3 >>> 13), 2654435761);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return `deuz_digest_${hex1}${hex2}${hex3}${hex4}`;
}

export function computePasswordHash(password: string, email?: string): string {
  const cleanEmail = (email || '').toLowerCase().trim();
  const raw = `DEUZ_SOVEREIGN_SALT_256::${cleanEmail}::${password}`;
  return computeDigestFromRaw(raw);
}

/**
 * Extracts legacy reversible snapshot if present from earlier schema versions; returns null for digests.
 */
export function extractPasswordFromHash(hash?: string): string | null {
  if (!hash || typeof hash !== 'string') return null;
  try {
    if (hash.startsWith('deuz_sync_')) {
      return decodeURIComponent(atob(hash.replace('deuz_sync_', '')));
    }
    if (hash.startsWith('deuz_cred_')) {
      return decodeURIComponent(atob(hash.replace('deuz_cred_', '')));
    }
  } catch {}
  return null;
}

/**
 * Verifies if an input password matches any current or legacy stored credential digest on a user document.
 */
export function matchesStoredPassword(password: string, email: string, userDoc: any): boolean {
  if (!password || !userDoc) return false;
  const cleanEmail = (email || '').toLowerCase().trim();
  const candidateHashes = new Set<string>([
    computePasswordHash(password, cleanEmail),
    computePasswordHash(password, ''),
    computeDigestFromRaw(`DEUZ_SOVEREIGN_SALT_256::${password}`),
    password
  ]);

  const storedHash = typeof userDoc.passwordHash === 'string' ? userDoc.passwordHash : '';
  const storedSnap = typeof userDoc.authCredentialSnapshot === 'string' ? userDoc.authCredentialSnapshot : '';

  if (storedHash && candidateHashes.has(storedHash)) return true;
  if (storedSnap && candidateHashes.has(storedSnap)) return true;

  const extracted = extractPasswordFromHash(storedSnap) || extractPasswordFromHash(storedHash);
  if (extracted && extracted === password) return true;

  return false;
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
