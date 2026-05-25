import { createClient } from '@/lib/supabase/server'
import { IntentHeader } from '@/components/leads/intent-header'
import { MonitorsList } from '@/components/leads/monitors-list'
import { SearchResultsList } from '@/components/leads/search-results-list'

export default async function IntentMonitorPage() {
  const supabase = await createClient()

  const { data: monitors } = await supabase
    .from('search_monitors')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: results } = await supabase
    .from('search_results')
    .select('*, search_monitors(name)')
    .order('found_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-6">
      <IntentHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MonitorsList monitors={monitors || []} />
        </div>
        <div className="lg:col-span-2">
          <SearchResultsList results={results || []} />
        </div>
      </div>
    </div>
  )
}
