'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Target, TrendingUp, Mail, Flame, DollarSign } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalLeads: number
    hotLeads: number
    totalDeals: number
    pipelineValue: number
    wonDeals: number
    wonRevenue: number
    emailsSent: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Hot Leads',
      value: stats.hotLeads.toLocaleString(),
      icon: Flame,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      subtitle: 'Score 70+',
    },
    {
      title: 'Active Deals',
      value: stats.totalDeals.toLocaleString(),
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(stats.pipelineValue),
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Won Revenue',
      value: formatCurrency(stats.wonRevenue),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${stats.wonDeals} deals closed`,
    },
    {
      title: 'Emails Sent',
      value: stats.emailsSent.toLocaleString(),
      icon: Mail,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                <p className="text-lg font-bold text-foreground truncate">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString()}`
}
