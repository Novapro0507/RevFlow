'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import type { Deal } from '@/lib/types'
import { differenceInDays } from 'date-fns'

interface DealInsightsProps {
  deal: Deal
}

export function DealInsights({ deal }: DealInsightsProps) {
  const daysSinceCreated = differenceInDays(new Date(), new Date(deal.created_at))
  const daysSinceUpdated = differenceInDays(new Date(), new Date(deal.updated_at))

  // Calculate weighted probability based on deal age and activity
  let adjustedProbability = deal.probability
  if (daysSinceUpdated > 14) {
    adjustedProbability = Math.max(adjustedProbability - 20, 0)
  } else if (daysSinceUpdated > 7) {
    adjustedProbability = Math.max(adjustedProbability - 10, 0)
  }

  const isStale = daysSinceUpdated > 7
  const isAtRisk = daysSinceUpdated > 14

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <CardTitle className="text-foreground">AI Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Close Probability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Close Probability</span>
            <span className={`font-medium ${getProbabilityColor(adjustedProbability)}`}>
              {adjustedProbability}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getProbabilityBgColor(adjustedProbability)}`}
              style={{ width: `${adjustedProbability}%` }}
            />
          </div>
          {adjustedProbability !== deal.probability && (
            <p className="text-xs text-muted-foreground mt-1">
              Adjusted from {deal.probability}% due to inactivity
            </p>
          )}
        </div>

        {/* Status Indicators */}
        <div className="space-y-3">
          {isAtRisk && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Deal at Risk</p>
                <p className="text-xs text-muted-foreground">
                  No activity for {daysSinceUpdated} days. Consider reaching out.
                </p>
              </div>
            </div>
          )}

          {isStale && !isAtRisk && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <Clock className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Getting Stale</p>
                <p className="text-xs text-muted-foreground">
                  Last activity was {daysSinceUpdated} days ago.
                </p>
              </div>
            </div>
          )}

          {!isStale && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <TrendingUp className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">On Track</p>
                <p className="text-xs text-muted-foreground">
                  Deal is progressing well with recent activity.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days in Pipeline</span>
            <span className="text-foreground font-medium">{daysSinceCreated}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deal Stage</span>
            <span className="text-foreground font-medium capitalize">{deal.stage.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expected Value</span>
            <span className="text-foreground font-medium">
              ${(Number(deal.value) * adjustedProbability / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">Suggested Actions</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {isAtRisk && (
              <li>Schedule an urgent follow-up call</li>
            )}
            {deal.stage === 'proposal' && (
              <li>Send a proposal follow-up email</li>
            )}
            {deal.stage === 'negotiation' && (
              <li>Prepare final pricing options</li>
            )}
            {deal.stage === 'qualified' && (
              <li>Book a demo or discovery call</li>
            )}
            {!isAtRisk && !isStale && (
              <li>Continue current engagement strategy</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function getProbabilityColor(probability: number): string {
  if (probability >= 70) return 'text-success'
  if (probability >= 40) return 'text-warning'
  return 'text-muted-foreground'
}

function getProbabilityBgColor(probability: number): string {
  if (probability >= 70) return 'bg-success'
  if (probability >= 40) return 'bg-warning'
  return 'bg-muted-foreground'
}
