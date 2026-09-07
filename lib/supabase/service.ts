import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for single-tenant / no-login mode.
 *
 * The app runs as an internal tool with no user session, so we cannot rely on
 * the cookie-based anon client or RLS. This client uses the service role key
 * and bypasses RLS. NEVER import this into a Client Component — server only.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}
