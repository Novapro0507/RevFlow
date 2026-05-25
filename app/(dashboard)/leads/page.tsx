import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LeadsHeader } from '@/components/leads/leads-header'
import { LeadsFilters } from '@/components/leads/leads-filters'
import { LeadsTable } from '@/components/leads/leads-table'
import { Spinner } from '@/components/ui/spinner'

interface LeadsPageProps {
  searchParams: Promise<{ 
    status?: string
    type?: string
    search?: string
    sort?: string
    filter?: string
  }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query based on filters
  let query = supabase.from('leads').select('*')

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.type && params.type !== 'all') {
    query = query.eq('lead_type', params.type)
  }

  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%,company.ilike.%${params.search}%`)
  }

  if (params.filter === 'hot') {
    query = query.gte('lead_score', 70)
  }

  // Sort
  const sortField = params.sort?.split(':')[0] || 'created_at'
  const sortOrder = params.sort?.split(':')[1] === 'asc' ? true : false
  query = query.order(sortField, { ascending: sortOrder })

  const { data: leads, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching leads:', error)
  }

  // Get counts for filters
  const { count: totalCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  const { count: hotCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('lead_score', 70)

  return (
    <div className="p-6 space-y-6">
      <LeadsHeader />
      
      <LeadsFilters 
        currentStatus={params.status}
        currentType={params.type}
        currentSearch={params.search}
        totalCount={totalCount || 0}
        hotCount={hotCount || 0}
      />
      
      <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
        <LeadsTable leads={leads || []} />
      </Suspense>
    </div>
  )
}
