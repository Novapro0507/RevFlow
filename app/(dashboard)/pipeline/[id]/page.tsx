import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DealHeader } from '@/components/pipeline/deal-header'
import { DealInfo } from '@/components/pipeline/deal-info'
import { DealActivity } from '@/components/pipeline/deal-activity'
import { DealInsights } from '@/components/pipeline/deal-insights'

interface DealDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: deal, error } = await supabase
    .from('deals')
    .select('*, pipelines(*)')
    .eq('id', id)
    .single()

  if (error || !deal) {
    notFound()
  }

  // Fetch activities for this deal
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch linked lead if exists
  let linkedLead = null
  if (deal.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', deal.lead_id)
      .single()
    linkedLead = lead
  }

  return (
    <div className="p-6 space-y-6">
      <DealHeader deal={deal} pipeline={deal.pipelines} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DealInfo deal={deal} linkedLead={linkedLead} />
          <DealActivity activities={activities || []} dealId={deal.id} />
        </div>
        <div>
          <DealInsights deal={deal} />
        </div>
      </div>
    </div>
  )
}
