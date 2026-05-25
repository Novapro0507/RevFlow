'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Calendar, 
  DollarSign,
  Building,
  GripVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Pipeline, Deal, PipelineStage } from '@/lib/types'

interface PipelineBoardProps {
  pipeline: Pipeline
  deals: Deal[]
}

const stageColors: Record<string, string> = {
  lead: 'bg-muted',
  contacted: 'bg-primary/20',
  qualified: 'bg-primary/40',
  proposal: 'bg-primary/60',
  negotiation: 'bg-warning/60',
  closed_won: 'bg-success',
  closed_lost: 'bg-destructive/50',
}

export function PipelineBoard({ pipeline, deals }: PipelineBoardProps) {
  const router = useRouter()
  const [draggingDeal, setDraggingDeal] = useState<string | null>(null)

  const handleDragStart = (dealId: string) => {
    setDraggingDeal(dealId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (stageId: string) => {
    if (!draggingDeal) return

    const supabase = createClient()
    await supabase
      .from('deals')
      .update({ 
        stage: stageId,
        updated_at: new Date().toISOString(),
        // Update probability based on stage
        probability: getStageProbability(stageId),
        // If won/lost, set actual close date
        actual_close_date: stageId === 'closed_won' || stageId === 'closed_lost' 
          ? new Date().toISOString().split('T')[0]
          : null,
      })
      .eq('id', draggingDeal)

    setDraggingDeal(null)
    router.refresh()
  }

  const stages = pipeline.stages as PipelineStage[]

  return (
    <div className="h-full overflow-x-auto p-6 pt-4">
      <div className="flex gap-4 h-full min-w-max">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.id)
          const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)

          return (
            <div
              key={stage.id}
              className="w-72 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stageColors[stage.id] || 'bg-muted'}`} />
                  <span className="font-medium text-foreground">{stage.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  ${formatValue(stageValue)}
                </span>
              </div>

              {/* Stage Cards */}
              <div className="flex-1 space-y-2 overflow-y-auto min-h-[200px] p-1">
                {stageDeals.map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    onDragStart={() => handleDragStart(deal.id)}
                  />
                ))}
                {stageDeals.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Drop deals here</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DealCard({ deal, onDragStart }: { deal: Deal; onDragStart: () => void }) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-card border-border cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link 
              href={`/pipeline/${deal.id}`}
              className="font-medium text-foreground hover:text-primary truncate block"
            >
              {deal.title}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/pipeline/${deal.id}`}>View Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {deal.company_name && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Building className="w-3 h-3" />
              <span className="truncate">{deal.company_name}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <DollarSign className="w-4 h-4 text-success" />
              <span>{Number(deal.value).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {deal.expected_close_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(deal.expected_close_date), 'MMM d')}</span>
                </div>
              )}
              <Badge 
                variant={deal.probability >= 70 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {deal.probability}%
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function getStageProbability(stageId: string): number {
  const probabilities: Record<string, number> = {
    lead: 10,
    contacted: 20,
    qualified: 40,
    proposal: 60,
    negotiation: 80,
    closed_won: 100,
    closed_lost: 0,
  }
  return probabilities[stageId] || 10
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toLocaleString()
}
