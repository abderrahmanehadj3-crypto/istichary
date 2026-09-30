import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { saveUserProfile } from './supabaseSync';

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
 * Triggers Google Sign-In via Supabase OAuth Provider:
 * - Uses supabase.auth.signInWithOAuth({ provider: 'google' })
 * - Redirects to origin for smooth authentication across mobile browsers and WebViews.
 */
export async function triggerGoogleSignIn(): Promise<{ success: boolean; error?: string }> {
  // Cancel any automatic One-Tap auto-select if present
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel();
      window.google.accounts.id.disableAutoSelect();
    } catch (e) {}
  }

  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.warn('[Supabase Google Auth] signInWithOAuth notice:', error.message);
      return { success: false, error: error.message };
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Google Auth] Exception:', err);
    return { success: false, error: err.message || 'فشل الاتصال بمزود Google' };
  }
}

/**
 * Checks for returned Supabase user session after Google OAuth redirect
 */
export async function checkGoogleRedirectResult(): Promise<GoogleUserProfile | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Supabase Auth] getSession notice:', error.message);
      return null;
    }

    if (session?.user) {
      const sbUser = session.user;
      const email = sbUser.email || '';
      const name =
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        email.split('@')[0] ||
        'مستخدم Google';
      const avatarUrl =
        sbUser.user_metadata?.avatar_url ||
        sbUser.user_metadata?.picture ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

      const profile: GoogleUserProfile = {
        email,
        name,
        avatarUrl,
        googleId: sbUser.id,
        verifiedEmail: !!sbUser.email_confirmed_at,
      };

      // Sync with Supabase profiles table
      try {
        await saveUserProfile({
          id: sbUser.id,
          email,
          displayName: name,
          avatarUrl,
          phone: sbUser.phone || '',
          phoneVerified: !!sbUser.phone,
          wilaya: '16',
          customerProfileCompleted: false,
          accountConfirmed: true,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('[Supabase Auth] Profile persistence notice:', dbErr);
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
    console.warn('[Supabase Auth] checkGoogleRedirectResult exception:', err);
  }

  return null;
}

// Backwards-compatible aliases
export const signInWithFirebaseGoogle = triggerGoogleSignIn;
export const signInWithSupabaseGoogle = triggerGoogleSignIn;
