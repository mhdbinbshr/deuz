import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../src/config/firebase';

export const ADMIN_EMAIL = 'muhammadbinbasheer777@gmail.com';

/**
 * Validates if the email address belongs to the designated executive administrator.
 */
export function isExecutiveAdminEmail(email: string): boolean {
  return (email || '').toLowerCase().trim() === ADMIN_EMAIL;
}

/**
 * Legacy compatibility stub. All authentication must strictly go through Firebase Authentication.
 */
export async function verifyAdminPasskey(_password: string): Promise<boolean> {
  // Always return false: Firebase Authentication is the sole source of truth for passwords.
  return false;
}

