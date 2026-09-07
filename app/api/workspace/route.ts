import { NextResponse } from 'next/server'
import { getWorkspaceUserId } from '@/lib/workspace'

// Returns the shared single-tenant workspace user id for client components.
// No auth required — the app runs as an internal, no-login tool.
export async function GET() {
  const userId = await getWorkspaceUserId()
  if (!userId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }
  return NextResponse.json({ userId })
}
