"use client"

import { Card } from "@/components/ui/card"
import { Filter } from "lucide-react"

const stages = [
  { name: "New Leads", count: 1250, percentage: 100 },
  { name: "Contacted", count: 890, percentage: 71 },
  { name: "Qualified", count: 520, percentage: 42 },
  { name: "Proposal", count: 280, percentage: 22 },
  { name: "Negotiation", count: 145, percentage: 12 },
  { name: "Closed Won", count: 98, percentage: 8 },
]

export function ConversionFunnel() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Filter className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Conversion Funnel</h3>
          <p className="text-sm text-muted-foreground">Lead to close journey</p>
        </div>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{stage.name}</span>
              <span className="text-muted-foreground">
                {stage.count} ({stage.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ 
                  width: `${stage.percentage}%`,
                  opacity: 1 - (index * 0.12)
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Conversion</span>
          <span className="text-lg font-semibold text-primary">7.8%</span>
        </div>
      </div>
    </Card>
  )
}
