'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  DollarSign,
  MoreHorizontal,
  Trash2,
  Calendar
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Deal, Pipeline, PipelineStage } from '@/lib/types'

interface DealHeaderProps {
  deal: Deal
  pipeline: Pipeline
}

export function DealHeader({ deal, pipeline }: DealHeaderProps) {
  const router = useRouter()
  const [stage, setStage] = useState(deal.stage)
  const [updating, setUpdating] = useState(false)

  const stages = pipeline.stages as PipelineStage[]

  const handleStageChange = async (newStage: string) => {
    setUpdating(true)
    setStage(newStage)

    const supabase = createClient()
    await supabase
      .from('deals')
      .update({ 
        stage: newStage, 
        updated_at: new Date().toISOString(),
        probability: getStageProbability(newStage),
        actual_close_date: newStage === 'closed_won' || newStage === 'closed_lost'
          ? new Date().toISOString().split('T')[0]
          : null,
      })
      .eq('id', deal.id)

    setUpdating(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal?')) return

    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', deal.id)
    router.push('/pipeline')
    router.refresh()
  }

  const currentStage = stages.find(s => s.id === stage)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/pipeline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pipeline
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{deal.title}</h1>
            <Badge variant={stage === 'closed_won' ? 'default' : stage === 'closed_lost' ? 'destructive' : 'secondary'}>
              {currentStage?.name || stage}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            {deal.company_name && (
              <span>{deal.company_name}</span>
            )}
            <div className="flex items-center gap-1 text-success font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{Number(deal.value).toLocaleString()} {deal.currency}</span>
            </div>
            {deal.expected_close_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Close: {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={stage}
            onValueChange={handleStageChange}
            disabled={updating}
          >
            <SelectTrigger className="w-40 bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Deal</DropdownMenuItem>
              <DropdownMenuItem>Send Email</DropdownMenuItem>
              <DropdownMenuItem>Schedule Call</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
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
