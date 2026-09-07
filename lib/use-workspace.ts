'use client'

import { useEffect, useState } from 'react'

/**
 * Client-side hook to resolve the shared single-tenant workspace user id.
 * The app has no login, so instead of `supabase.auth.getUser()` client
 * components call this to get the workspace id for scoping queries/inserts.
 */
export function useWorkspaceUserId() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/workspace')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.userId) setUserId(data.userId)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { userId, loading }
}
