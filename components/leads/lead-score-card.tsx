'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, Target, Clock } from 'lucide-react'
import type { Lead } from '@/lib/types'

interface LeadScoreCardProps {
  lead: Lead
}

export function LeadScoreCard({ lead }: LeadScoreCardProps) {
  const scoreColor = getScoreColor(lead.lead_score)
  const scoreLabel = getScoreLabel(lead.lead_score)

  // Mock AI insights - in production these would come from real AI analysis
  const insights = [
    {
      icon: TrendingUp,
      label: 'Engagement',
      value: lead.lead_score >= 50 ? 'High' : 'Low',
      color: lead.lead_score >= 50 ? 'text-success' : 'text-muted-foreground',
    },
    {
      icon: Target,
      label: 'Fit Score',
      value: lead.lead_type === 'b2b' ? 'Good Match' : 'Moderate',
      color: lead.lead_type === 'b2b' ? 'text-success' : 'text-warning',
    },
    {
      icon: Clock,
      label: 'Best Time',
      value: 'Tue 10am',
      color: 'text-primary',
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <CardTitle className="text-foreground">Lead Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${lead.lead_score * 3.52} 352`}
                strokeLinecap="round"
                className={scoreColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{lead.lead_score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className={`mt-2 font-medium ${scoreColor}`}>{scoreLabel}</p>
        </div>

        {/* Intent Strength */}
        {lead.intent_strength > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Intent Strength</span>
              <span className="text-sm font-medium text-foreground">{lead.intent_strength}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${lead.intent_strength}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <insight.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{insight.label}</span>
              </div>
              <span className={`text-sm font-medium ${insight.color}`}>
                {insight.value}
              </span>
            </div>
          ))}
        </div>

        {/* Intent Signals */}
        {lead.intent_signals && lead.intent_signals.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-2">Intent Signals</p>
            <div className="space-y-1">
              {lead.intent_signals.map((signal, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  {signal}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-muted-foreground'
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Hot Lead'
  if (score >= 40) return 'Warm Lead'
  return 'Cold Lead'
}
