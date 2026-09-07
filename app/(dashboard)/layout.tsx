import { createServiceClient } from '@/lib/supabase/service'
import { getWorkspaceUserId } from '@/lib/workspace'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const workspaceUserId = await getWorkspaceUserId()

  let profile = null
  if (workspaceUserId) {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', workspaceUserId)
      .single()
    profile = data
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={null} profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
