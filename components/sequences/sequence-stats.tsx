"use client"

import { Card } from "@/components/ui/card"
import { Users, CheckCircle, MessageSquare, AlertTriangle } from "lucide-react"

interface SequenceStatsProps {
  stats: {
    enrolled: number
    completed: number
    replied: number
    bounced: number
  }
}

export function SequenceStats({ stats }: SequenceStatsProps) {
  const statItems = [
    {
      label: "Total Enrolled",
      value: stats.enrolled,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Replied",
      value: stats.replied,
      icon: MessageSquare,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Bounced",
      value: stats.bounced,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ]

  const replyRate = stats.enrolled > 0 
    ? ((stats.replied / stats.enrolled) * 100).toFixed(1) 
    : "0"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {item.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </div>
        </Card>
      ))}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{replyRate}%</p>
            <p className="text-sm text-muted-foreground">Reply Rate</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
