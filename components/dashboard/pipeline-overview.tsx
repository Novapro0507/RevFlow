'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Deal } from '@/lib/types'

interface PipelineOverviewProps {
  deals: Deal[]
}

const stages = [
  { id: 'lead', name: 'Lead', color: 'bg-muted' },
  { id: 'contacted', name: 'Contacted', color: 'bg-primary/30' },
  { id: 'qualified', name: 'Qualified', color: 'bg-primary/50' },
  { id: 'proposal', name: 'Proposal', color: 'bg-primary/70' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-warning/70' },
  { id: 'closed_won', name: 'Won', color: 'bg-success' },
]

export function PipelineOverview({ deals }: PipelineOverviewProps) {
  const stageData = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage.id)
    const value = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0)
    return {
      ...stage,
      count: stageDeals.length,
      value,
    }
  })

  const maxValue = Math.max(...stageData.map(s => s.value), 1)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Pipeline Overview</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pipeline">
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No deals yet. Start by creating your first deal.</p>
            <Button asChild>
              <Link href="/pipeline/new">Create Deal</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stageData.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{stage.name}</span>
                  <span className="text-muted-foreground">
                    {stage.count} deals - ${stage.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(stage.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
