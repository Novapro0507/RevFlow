"use client"

import { Card } from "@/components/ui/card"
import { PieChart as PieChartIcon } from "lucide-react"
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const data = [
  { name: "Google Intent", value: 35, color: "#3b82f6" },
  { name: "Apollo.io", value: 28, color: "#8b5cf6" },
  { name: "Hunter.io", value: 18, color: "#06b6d4" },
  { name: "Direct/Manual", value: 12, color: "#10b981" },
  { name: "Referrals", value: 7, color: "#f59e0b" },
]

export function LeadSourceChart() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <PieChartIcon className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Lead Sources</h3>
          <p className="text-sm text-muted-foreground">Where your leads come from</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`${value}%`, "Share"]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
