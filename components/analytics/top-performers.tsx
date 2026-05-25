"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"

const performers = [
  { 
    name: "Enterprise Plan - TechCorp", 
    value: 125000, 
    change: 15.2, 
    status: "closed_won",
    daysToClose: 45 
  },
  { 
    name: "Annual License - StartupXYZ", 
    value: 48000, 
    change: 8.5, 
    status: "negotiation",
    daysToClose: 12 
  },
  { 
    name: "Custom Solution - MegaCo", 
    value: 95000, 
    change: -3.2, 
    status: "proposal",
    daysToClose: 28 
  },
  { 
    name: "SaaS Bundle - GlobalInc", 
    value: 67000, 
    change: 22.1, 
    status: "qualified",
    daysToClose: 35 
  },
]

export function TopPerformers() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Top Deals</h3>
          <p className="text-sm text-muted-foreground">Highest value opportunities</p>
        </div>
      </div>

      <div className="space-y-4">
        {performers.map((deal, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{deal.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {deal.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {deal.daysToClose}d to close
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ${deal.value.toLocaleString()}
              </p>
              <div className={`flex items-center justify-end gap-1 text-sm ${
                deal.change >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {deal.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(deal.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
