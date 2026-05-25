import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeadDetailHeader } from '@/components/leads/lead-detail-header'
import { LeadInfo } from '@/components/leads/lead-info'
import { LeadActivity } from '@/components/leads/lead-activity'
import { LeadScoreCard } from '@/components/leads/lead-score-card'

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !lead) {
    notFound()
  }

  // Fetch activities for this lead
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch any deals associated with this lead
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('lead_id', id)

  return (
    <div className="p-6 space-y-6">
      <LeadDetailHeader lead={lead} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadInfo lead={lead} />
          <LeadActivity activities={activities || []} leadId={lead.id} />
        </div>
        <div className="space-y-6">
          <LeadScoreCard lead={lead} />
          {deals && deals.length > 0 && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-medium text-foreground mb-2">Associated Deals</h3>
              <div className="space-y-2">
                {deals.map((deal) => (
                  <div key={deal.id} className="text-sm">
                    <p className="text-foreground">{deal.title}</p>
                    <p className="text-muted-foreground">${Number(deal.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
