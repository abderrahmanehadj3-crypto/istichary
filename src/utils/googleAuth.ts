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
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

/**
 * Safely decodes a JWT token returned by Google One-Tap or Google Identity Services
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
 * Initiates the Google Sign-In flow:
 * 1. Checks for Google Identity Services SDK in window
 * 2. Attempts to prompt Google One-Tap account chooser on device
 * 3. Supports standard Google Sign-In popup / Supabase OAuth
 */
export async function triggerGoogleSignIn(clientId?: string): Promise<GoogleUserProfile | null> {
  const effectiveClientId =
    clientId ||
    import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
    '889315027566-google-signin.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    // Check if Google GSI is available
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: effectiveClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              const payload = decodeGoogleJwt(response.credential);
              if (payload && payload.email) {
                resolve({
                  email: payload.email,
                  name: payload.name || payload.given_name || 'مستخدم Google',
                  avatarUrl:
                    payload.picture ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                  googleId: payload.sub || String(Date.now()),
                  verifiedEmail: payload.email_verified ?? true,
                });
                return;
              }
            }
            resolve(null);
          },
        });

        // Trigger Google One-Tap account prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.info('[GoogleAuth] One-Tap prompt not displayed in current iframe/sandbox context:', notification.getNotDisplayedReason());
            resolve(null);
          } else if (notification.isSkippedMoment()) {
            resolve(null);
          } else if (notification.isDismissedMoment()) {
            resolve(null);
          }
        });
      } catch (err) {
        console.warn('[GoogleAuth] GSI initialization error:', err);
        resolve(null);
      }
    } else {
      // If GSI script not yet loaded or blocked, resolve null to allow fallback account chooser
      resolve(null);
    }
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
