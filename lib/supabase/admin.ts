import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side admin client: uses SUPABASE_SERVICE_ROLE_KEY if available (bypasses RLS),
// otherwise falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
