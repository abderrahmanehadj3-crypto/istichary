import { createClient } from '@supabase/supabase-js';

// Hardcoded production credentials matching your exact Supabase project instance
export const PRODUCTION_SUPABASE_URL = 'https://oqdgngfhupadfirmsfbfj.supabase.co';
export const PRODUCTION_SUPABASE_ANON_KEY = 'sb_publishable_T4iSALFPm1Y09Nc6QWdvQA_j8nCDCKL';

/**
 * Sanitizes and extracts configuration strings, ensuring no undefined, null, or empty values.
 */
function getCleanConfig(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/^["']|["']$/g, '');
    if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return fallback;
}

// 1. URL: Reads directly from import.meta.env with hardcoded production fallback, ensuring no trailing slash
export const SUPABASE_URL: string = getCleanConfig(
  import.meta.env?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL,
  PRODUCTION_SUPABASE_URL
).replace(/\/+$/, '');

// 2. Anon Key: Reads directly from import.meta.env with hardcoded production fallback
export const SUPABASE_ANON_KEY: string = getCleanConfig(
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY,
  PRODUCTION_SUPABASE_ANON_KEY
);

// 3. Initialize Supabase client targeting the exact production instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'istichary-telehealth',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

