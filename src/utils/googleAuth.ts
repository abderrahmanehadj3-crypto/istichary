import {
  signInWithPopup,
  signInWithRedirect,
  googleAuthProvider,
  auth,
  db,
} from '../firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface GoogleUserProfile {
  email: string;
  name: string;
  avatarUrl: string;
  googleId: string;
  verifiedEmail: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id?: {
          initialize: (config: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Validates whether a given Google OAuth Client ID is legitimate
 */
export function isValidGoogleClientId(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (
    trimmed === '' ||
    trimmed.includes('google-signin') ||
    trimmed.includes('MY_GOOGLE_CLIENT_ID') ||
    trimmed.includes('placeholder')
  ) {
    return false;
  }
  return /^[0-9]+-[a-zA-Z0-9_\-]{10,}\.apps\.googleusercontent\.com$/i.test(trimmed);
}

/**
 * Safely decodes a JWT token if needed
 */
export function decodeGoogleJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('[GoogleAuth] Failed to decode Google JWT token:', e);
    return null;
  }
}

/**
 * Primary Google Sign-In via Firebase Authentication:
 * - Uses Firebase signInWithPopup with GoogleAuthProvider
 * - Synchronizes authenticated user directly to Firestore 'profiles' collection
 * - Strictly stores only the public photoURL in profiles (never biometric selfie)
 */
export async function triggerGoogleSignIn(): Promise<GoogleUserProfile | null> {
  // Explicitly cancel any One-Tap auto-select if present
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel();
      window.google.accounts.id.disableAutoSelect();
    } catch (e) {}
  }

  // 1. Attempt Official Firebase Auth Google Popup
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;

    if (user && user.email) {
      const profile: GoogleUserProfile = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatarUrl:
          user.photoURL ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        googleId: user.uid,
        verifiedEmail: user.emailVerified,
      };

      // Persist profile to Cloud Firestore
      try {
        const userRef = doc(db, 'profiles', user.uid);
        const existing = await getDoc(userRef);
        if (!existing.exists()) {
          await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            displayName: profile.name,
            avatarUrl: profile.avatarUrl,
            role: 'customer',
            wilaya: '16',
            accountConfirmed: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('[Firebase Google Auth] Profile persistence notice:', dbErr);
      }

      // Also notify backend API
      fetch('/api/auth/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});

      return profile;
    }
  } catch (firebaseErr: any) {
    console.warn('[Firebase Google Auth] Popup notice:', firebaseErr.message || firebaseErr);

    // Fallback: If popup was blocked or iframe restriction, try redirect
    if (firebaseErr?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleAuthProvider);
      } catch (redirErr) {
        console.warn('[Firebase Google Auth] Redirect fallback notice:', redirErr);
      }
    }
  }

  return null;
}

/**
 * Triggers Firebase Google Auth redirect flow
 */
export async function signInWithFirebaseGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    if (result.user) {
      return { success: true };
    }
    return { success: false, error: 'لم يتم استرجاع بيانات المستخدم' };
  } catch (err: any) {
    console.warn('[GoogleAuth] Firebase Google OAuth exception:', err);
    return { success: false, error: err.message || 'فشل الاتصال بـ Firebase Google Auth' };
  }
}

// Backwards-compatible alias for existing callers
export const signInWithSupabaseGoogle = signInWithFirebaseGoogle;
