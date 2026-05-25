import { createClient } from '@/lib/supabase/server'
import { DispatchCenter } from '@/components/dispatch/dispatch-center'

export default async function DispatchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <DispatchCenter 
      initialJobs={jobs || []} 
      teamMembers={teamMembers || []}
      userId={user?.id || ''}
    />
  )
}
