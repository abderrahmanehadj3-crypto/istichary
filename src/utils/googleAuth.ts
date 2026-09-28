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
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
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
 * - Google One-Tap (prompt()) is COMPLETELY DISABLED and removed.
 * - Uses Google Identity Services OAuth2 popup or Supabase OAuth.
 * - Never injects any automatic One-Tap dropdown or iframe overlay into the DOM.
 */
export async function triggerGoogleSignIn(clientId?: string): Promise<GoogleUserProfile | null> {
  const effectiveClientId =
    clientId ||
    import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
    '889315027566-google-signin.apps.googleusercontent.com';

  // 1. Explicitly cancel and disable any One-Tap auto-prompting or auto-select
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel();
      window.google.accounts.id.disableAutoSelect();
    } catch (e) {
      console.warn('[GoogleAuth] disableAutoSelect notice:', e);
    }
  }

  // 2. Manual click-to-sign-in via Google OAuth2 Token Client popup
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data?.email) {
                    resolve({
                      email: data.email,
                      name: data.name || data.given_name || 'مستخدم Google',
                      avatarUrl:
                        data.picture ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                      googleId: data.sub || String(Date.now()),
                      verifiedEmail: data.email_verified ?? true,
                    });
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
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('[GoogleAuth] OAuth2 client error:', err);
      }
    }

    resolve(null);
  });
}

/**
 * Triggers Supabase Google OAuth popup/redirect flow
 */
export async function signInWithSupabaseGoogle(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.warn('[GoogleAuth] Supabase Google OAuth error:', error);
    }
  } catch (err) {
    console.warn('[GoogleAuth] Supabase OAuth exception:', err);
  }
}
