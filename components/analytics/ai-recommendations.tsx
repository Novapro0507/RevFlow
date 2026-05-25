"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Clock, Target, Mail, TrendingUp } from "lucide-react"

const recommendations = [
  {
    type: "timing",
    icon: Clock,
    title: "Optimal Send Time",
    description: "Your emails get 34% more opens when sent Tuesday 10am EST",
    action: "Apply to Sequences",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    type: "lead",
    icon: Target,
    title: "High-Intent Leads",
    description: "12 new leads showing strong buying signals in Austin market",
    action: "View Leads",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    type: "sequence",
    icon: Mail,
    title: "Sequence Optimization",
    description: "Adding a 3rd follow-up could increase conversions by 18%",
    action: "Edit Sequence",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    type: "deal",
    icon: TrendingUp,
    title: "At-Risk Deal",
    description: "TechCorp deal inactive for 7 days - recommend immediate outreach",
    action: "Take Action",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
]

export function AIRecommendations() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Recommendations</h3>
          <p className="text-sm text-muted-foreground">Smart insights for you</p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            className="p-3 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg ${rec.bgColor}`}>
                <rec.icon className={`h-4 w-4 ${rec.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{rec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {rec.description}
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 mt-1 text-xs text-primary"
                >
                  {rec.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
