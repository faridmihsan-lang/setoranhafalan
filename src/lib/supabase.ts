import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not default placeholders
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== 'your-anon-public-key' &&
  supabaseUrl.startsWith('https://')
);

// Fallback dummy for development sandbox when variables are not yet provided
const fallbackUrl = 'https://placeholder-tahfiz.supabase.co';
const fallbackKey = 'placeholder-anon-key-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
} {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : 'Belum Dikonfigurasi (Mode Simulasi Fondasi)',
    hasAnonKey: Boolean(supabaseAnonKey && supabaseAnonKey !== 'your-anon-public-key')
  };
}
