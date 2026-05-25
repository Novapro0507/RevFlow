'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function AIInsights() {
  // These would come from real AI analysis in production
  const insights = [
    {
      icon: TrendingUp,
      title: 'Hot Lead Alert',
      description: '3 leads showing high purchase intent based on recent activity',
      action: '/leads?filter=hot',
      actionLabel: 'View leads',
    },
    {
      icon: Clock,
      title: 'Best Send Time',
      description: 'Tuesday 10am has 40% higher open rates for your emails',
      action: '/sequences',
      actionLabel: 'Update sequences',
    },
    {
      icon: Target,
      title: 'Deal at Risk',
      description: 'No activity on "Enterprise Deal" for 14 days',
      action: '/pipeline',
      actionLabel: 'View deal',
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <CardTitle className="text-foreground">AI Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-muted/30 border border-border space-y-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <insight.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {insight.description}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link href={insight.action}>
                {insight.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
