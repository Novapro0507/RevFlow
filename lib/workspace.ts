import { createServiceClient } from '@/lib/supabase/service'

/**
 * Single-tenant workspace resolver.
 *
 * The app runs without login, so there is no session user. Instead we treat the
 * first (oldest) account in the database as the shared workspace owner and scope
 * all reads/writes to that id. This keeps every existing row (which is stamped
 * with a user_id) reachable without requiring anyone to sign in.
 */
let cachedWorkspaceUserId: string | null = null

export async function getWorkspaceUserId(): Promise<string | null> {
  if (cachedWorkspaceUserId) return cachedWorkspaceUserId

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    console.error('[v0] getWorkspaceUserId error:', error?.message)
    return null
  }

  cachedWorkspaceUserId = data.id
  return data.id
}
