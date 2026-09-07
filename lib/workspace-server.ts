import { createServiceClient } from '@/lib/supabase/service'
import { getWorkspaceUserId } from '@/lib/workspace'

/**
 * Server-side workspace context for pages and route handlers running in
 * single-tenant / no-login mode. Returns the service client (bypasses RLS)
 * plus the shared workspace user id used to scope reads and writes.
 */
export async function getWorkspaceContext() {
  const userId = await getWorkspaceUserId()
  const supabase = createServiceClient()
  return { supabase, userId }
}
