import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import { PipelineOverview } from '@/components/dashboard/pipeline-overview'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AIInsights } from '@/components/dashboard/ai-insights'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch dashboard stats
  const [
    { count: totalLeads },
    { count: hotLeads },
    { data: deals },
    { data: recentLeads },
    { data: activities },
    { count: emailsSent },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('lead_score', 70),
    supabase.from('deals').select('*'),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('emails_sent').select('*', { count: 'exact', head: true }),
  ])

  // Calculate pipeline stats
  const pipelineValue = deals?.reduce((sum, deal) => sum + Number(deal.value || 0), 0) || 0
  const wonDeals = deals?.filter(d => d.stage === 'closed_won') || []
  const wonRevenue = wonDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)

  const stats = {
    totalLeads: totalLeads || 0,
    hotLeads: hotLeads || 0,
    totalDeals: deals?.length || 0,
    pipelineValue,
    wonDeals: wonDeals.length,
    wonRevenue,
    emailsSent: emailsSent || 0,
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader userName={user?.user_metadata?.first_name || 'there'} />
      
      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PipelineOverview deals={deals || []} />
          <RecentLeads leads={recentLeads || []} />
        </div>
        <div className="space-y-6">
          <AIInsights />
          <ActivityFeed activities={activities || []} />
        </div>
      </div>
    </div>
  )
}
