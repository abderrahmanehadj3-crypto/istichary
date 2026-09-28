import { supabase } from '../supabaseClient';

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
 * and not a synthetic placeholder or dummy string.
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
  // Standard Google OAuth Web Client ID: <project-number>-<hash>.apps.googleusercontent.com
  return /^[0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com$/i.test(trimmed);
}

/**
 * Returns the configured Google Client ID from Vite environment if valid
 */
export function getConfiguredGoogleClientId(): string | null {
  const envId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
  if (isValidGoogleClientId(envId)) {
    return envId.trim();
  }
  return null;
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
 * Initiates the manual Google Sign-In flow on user click:
 * - Checks for a valid, non-placeholder Google Client ID.
 * - Google One-Tap (prompt()) is COMPLETELY DISABLED and removed.
 * - Uses Google Identity Services OAuth2 popup if a valid Client ID is present.
 * - Resolves safely without hanging or throwing unhandled 401 client errors.
 */
export async function triggerGoogleSignIn(clientId?: string): Promise<GoogleUserProfile | null> {
  const effectiveClientId = clientId || getConfiguredGoogleClientId();

  // 1. Explicitly cancel and disable any One-Tap auto-prompting or auto-select
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel();
      window.google.accounts.id.disableAutoSelect();
    } catch (e) {
      console.warn('[GoogleAuth] disableAutoSelect notice:', e);
    }
  }

  // 2. If no valid Google Client ID is configured, do not open a broken GIS popup that triggers Error 401
  if (!effectiveClientId) {
    console.info(
      '[GoogleAuth] No valid VITE_GOOGLE_CLIENT_ID configured in environment. Skipping GIS popup.'
    );
    return null;
  }

  // 3. Manual click-to-sign-in via Google OAuth2 Token Client popup
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      let isSettled = false;

      // Safety timeout so user is never stuck in infinite pending state
      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          console.warn('[GoogleAuth] OAuth popup timeout');
          resolve(null);
        }
      }, 60000);

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'email profile openid',
          error_callback: (err: any) => {
            console.warn('[GoogleAuth] OAuth error callback:', err);
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeoutId);
              resolve(null);
            }
          },
          callback: async (tokenResponse) => {
            if (isSettled) return;
            isSettled = true;
            clearTimeout(timeoutId);

            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data?.email) {
                    const profile: GoogleUserProfile = {
                      email: data.email,
                      name: data.name || data.given_name || 'مستخدم Google',
                      avatarUrl:
                        data.picture ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                      googleId: data.sub || String(Date.now()),
                      verifiedEmail: data.email_verified ?? true,
                    };

                    // Synchronize to backend/database asynchronously
                    fetch('/api/auth/google/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(profile),
                    }).catch((syncErr) => console.warn('[GoogleAuth] Sync notice:', syncErr));

                    resolve(profile);
                    return;
                  }
                }
              } catch (fetchErr) {
                console.warn('[GoogleAuth] Failed to fetch userinfo from Google API:', fetchErr);
              }
            }
            resolve(null);
          },
        });

        // Trigger manual popup (only on user click)
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[GoogleAuth] OAuth2 client init error:', err);
        clearTimeout(timeoutId);
        resolve(null);
        return;
      }
    }

    resolve(null);
  });
}

/**
 * Triggers Supabase Google OAuth popup/redirect flow
 */
export async function signInWithSupabaseGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : (import.meta.env?.VITE_VERCEL_APP_URL || 'https://sari3.vercel.app');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectOrigin,
      },
    });

    if (error) {
      console.warn('[GoogleAuth] Supabase Google OAuth error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[GoogleAuth] Supabase OAuth exception:', err);
    return { success: false, error: err.message || 'فشل الاتصال بمزود Google OAuth' };
  }
}

