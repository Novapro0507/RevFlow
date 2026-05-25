"use client"

import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DollarSign, TrendingUp, Users, Target } from "lucide-react"

interface AnalyticsHeaderProps {
  dateRange: string
  onDateRangeChange: (range: string) => void
  stats: {
    totalRevenue: number
    totalDeals: number
    totalLeads: number
    conversionRate: number
  }
}

export function AnalyticsHeader({ dateRange, onDateRangeChange, stats }: AnalyticsHeaderProps) {
  const statItems = [
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      positive: true,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Total Deals",
      value: stats.totalDeals.toLocaleString(),
      change: "+8.2%",
      positive: true,
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      change: "+24.1%",
      positive: true,
      icon: Users,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: "+2.3%",
      positive: true,
      icon: Target,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and get AI-powered insights
          </p>
        </div>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Card key={item.label} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className={`text-sm font-medium ${
                item.positive ? "text-emerald-400" : "text-red-400"
              }`}>
                {item.change}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
