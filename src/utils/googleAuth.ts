import {
  signInWithRedirect,
  getRedirectResult,
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
 * - Uses Firebase signInWithRedirect (PREVENTS POPUP BLOCKED ERRORS on mobile browsers & WebViews).
 * - Full-page redirect ensures smooth authentication on Chrome, Safari, Android, and iOS.
 */
export async function triggerGoogleSignIn(): Promise<void> {
  // Explicitly cancel any One-Tap auto-select if present
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel();
      window.google.accounts.id.disableAutoSelect();
    } catch (e) {}
  }

  // Use signInWithRedirect as requested to prevent popup blocking on mobile/WebViews
  console.info('[Firebase Google Auth] Initiating signInWithRedirect...');
  await signInWithRedirect(auth, googleAuthProvider);
}

/**
 * Processes the result of a Google signInWithRedirect upon page reload/return
 */
export async function checkGoogleRedirectResult(): Promise<GoogleUserProfile | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const profile: GoogleUserProfile = {
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'مستخدم Google',
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
        console.warn('[Firebase Google Auth] Profile persistence notice on redirect:', dbErr);
      }

      // Sync with backend API
      fetch('/api/auth/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      }).catch(() => {});

      return profile;
    }
  } catch (err: any) {
    console.warn('[Firebase Google Auth] getRedirectResult notice:', err.message || err);
  }

  return null;
}

/**
 * Triggers Firebase Google Auth redirect flow
 */
export async function signInWithFirebaseGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    await triggerGoogleSignIn();
    return { success: true };
  } catch (err: any) {
    console.warn('[GoogleAuth] Firebase Google OAuth exception:', err);
    return { success: false, error: err.message || 'فشل الاتصال بـ Firebase Google Auth' };
  }
}

// Backwards-compatible alias for existing callers
export const signInWithSupabaseGoogle = signInWithFirebaseGoogle;
