import { createClient } from '@/lib/supabase/server'
import { PipelineHeader } from '@/components/pipeline/pipeline-header'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get or create default pipeline
  let { data: pipeline } = await supabase
    .from('pipelines')
    .select('*')
    .eq('is_default', true)
    .single()

  // If no default pipeline, create one
  if (!pipeline && user) {
    const { data: newPipeline } = await supabase
      .from('pipelines')
      .insert({
        user_id: user.id,
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        is_default: true,
      })
      .select()
      .single()
    pipeline = newPipeline
  }

  // Fetch deals for this pipeline
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('pipeline_id', pipeline?.id || '')
    .order('updated_at', { ascending: false })

  // Calculate pipeline stats
  const totalValue = deals?.reduce((sum, d) => sum + Number(d.value || 0), 0) || 0
  const wonValue = deals?.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + Number(d.value || 0), 0) || 0

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-0">
        <PipelineHeader 
          pipeline={pipeline!} 
          totalValue={totalValue}
          wonValue={wonValue}
          dealCount={deals?.length || 0}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <PipelineBoard 
          pipeline={pipeline!} 
          deals={deals || []} 
        />
      </div>
    </div>
  )
}
