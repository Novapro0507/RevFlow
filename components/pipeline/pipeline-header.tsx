'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, DollarSign, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Pipeline } from '@/lib/types'

interface PipelineHeaderProps {
  pipeline: Pipeline
  totalValue: number
  wonValue: number
  dealCount: number
}

export function PipelineHeader({ pipeline, totalValue, wonValue, dealCount }: PipelineHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{pipeline.name}</h1>
          {pipeline.is_default && (
            <Badge variant="secondary">Default</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {pipeline.description || 'Manage your deals through the sales process'}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deals</p>
              <p className="font-medium text-foreground">{dealCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pipeline</p>
              <p className="font-medium text-foreground">${formatValue(totalValue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Won</p>
              <p className="font-medium text-foreground">${formatValue(wonValue)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button asChild>
            <Link href="/pipeline/new">
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}
