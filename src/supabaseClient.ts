import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://oqdgngfhupadfirmsfbfj.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_T4iSALFPm1Y09Nc6QWdvQA_j8nCDCKL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
