import { createClient } from '@supabase/supabase-js';

// Exact production credentials for the Istichary Supabase instance
export const PRODUCTION_SUPABASE_URL = 'https://oqdgngfhupadfirmsfbfj.supabase.co';
export const PRODUCTION_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZG5nZmh1cGFkZmlybXNmYmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTQ0MzgsImV4cCI6MjEwNDY5MDQzOH0.JPlKEtFJDoyUlkO2JSkx804o5JT1OyefFftfcqnMOMk';

// Helper to sanitize and validate configuration strings from Vite environment
const cleanEnvVar = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/^["']|["']$/g, '');
    if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return fallback;
};

// Guarantee clean URL without trailing slashes
export const SUPABASE_URL: string = cleanEnvVar(
  import.meta.env?.VITE_SUPABASE_URL,
  PRODUCTION_SUPABASE_URL
).replace(/\/+$/, '');

// Guarantee clean anon JWT key
export const SUPABASE_ANON_KEY: string = cleanEnvVar(
  import.meta.env?.VITE_SUPABASE_ANON_KEY,
  PRODUCTION_SUPABASE_ANON_KEY
);

// Initialize Supabase client cleanly without non-standard headers that trigger CORS preflight failures
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'istichary_sb_auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Utility to clear any corrupted or stale auth tokens from browser storage
 */
export const clearStaleAuthCache = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key === 'istichary_sb_auth' || key === 'istichary_user')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn('Failed to clear auth cache:', e);
  }
};
