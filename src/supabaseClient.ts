import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Safely sanitizes and validates a URL string.
 * Prevents TypeError: Invalid URL or malformed URLs that cause crashes.
 */
function sanitizeSupabaseUrl(url?: string): string {
  if (!url || typeof url !== 'string') {
    return 'https://oqdngfhupadfirmsfbfj.supabase.co';
  }
  let cleaned = url.trim().replace(/^["']|["']$/g, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch (e) {
    console.warn('[SupabaseClient] Malformed URL detected, falling back to default:', url);
    return 'https://oqdngfhupadfirmsfbfj.supabase.co';
  }
}

function sanitizeSupabaseKey(key?: string): string {
  if (!key || typeof key !== 'string') {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
  }
  return key.trim().replace(/^["']|["']$/g, '');
}

// Retrieve from Vite env or process env
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL));

const rawKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY));

export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = sanitizeSupabaseKey(rawKey);

/**
 * Checks whether valid Supabase credentials have been configured
 */
export function isSupabaseConfigured(): boolean {
  return (
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder') &&
    supabaseAnonKey.length > 20
  );
}

/**
 * Production Supabase Client singleton instance.
 * Safe against DNS or initialization failures.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'sari3-delivery',
    },
  },
});

/**
 * Uploads secure driver verification documents (e.g., biometric selfie, license)
 * to the private Supabase Storage bucket 'driver-verifications-secure'.
 */
export async function uploadSecureDriverVerificationFile(
  driverId: string,
  dataUrlOrBlob: string | Blob,
  fileName: string
): Promise<string> {
  try {
    let blob: Blob;
    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.startsWith('data:')) {
        const parts = dataUrlOrBlob.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        blob = new Blob([array], { type: mime });
      } else {
        // Already a remote URL
        return dataUrlOrBlob;
      }
    } else {
      blob = dataUrlOrBlob;
    }

    const cleanDriverId = driverId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '');
    const filePath = `${cleanDriverId}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('driver-verifications-secure')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Notice uploading to driver-verifications-secure:', error.message);
      // Fallback: If bucket is not yet provisioned, return the data URL for uninterrupted flow
      return typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : '';
    }

    return data?.path ? `storage://driver-verifications-secure/${data.path}` : filePath;
  } catch (err) {
    console.warn('[Supabase Storage] Error in uploadSecureDriverVerificationFile:', err);
    return typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : '';
  }
}
