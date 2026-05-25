'use client'

import { Card } from '@/components/ui/card'
import { Users, Target, TrendingUp, Mail, Flame, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      title: 'TOTAL CONTACTS',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      trend: null,
    },
    {
      title: 'HOT LEADS',
      value: stats.hotLeads,
      icon: Flame,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      subtitle: 'Score 70+',
      trend: null,
      pulse: true,
    },
    {
      title: 'ACTIVE DEALS',
      value: stats.totalDeals,
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      trend: null,
    },
    {
      title: 'PIPELINE VALUE',
      value: formatCurrency(stats.pipelineValue),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      isLarge: true,
    },
    {
      title: 'WON REVENUE',
      value: formatCurrency(stats.wonRevenue),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      subtitle: `${stats.wonDeals} closed`,
      isLarge: true,
    },
    {
      title: 'EMAILS SENT',
      value: stats.emailsSent,
      icon: Mail,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={cn(
            'relative overflow-hidden bg-card border-border hover:border-primary/30 transition-all duration-300',
            'group'
          )}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center border',
                card.bgColor,
                card.borderColor
              )}>
                <card.icon className={cn('w-5 h-5', card.color, card.pulse && 'animate-pulse')} />
              </div>
              {card.trend && (
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-mono',
                  card.trend > 0 ? 'text-success' : 'text-destructive'
                )}>
                  {card.trend > 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            
            <div>
              <p className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider mb-1">
                {card.title}
              </p>
              <p className={cn(
                'font-bold text-foreground tracking-tight',
                card.isLarge ? 'text-xl' : 'text-2xl'
              )}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              {card.subtitle && (
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{card.subtitle}</p>
              )}
            </div>
          </div>
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
