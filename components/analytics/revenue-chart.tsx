"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface RevenueChartProps {
  dateRange: string
}

const data = [
  { date: "Jan", revenue: 12000, deals: 8 },
  { date: "Feb", revenue: 19000, deals: 12 },
  { date: "Mar", revenue: 15000, deals: 10 },
  { date: "Apr", revenue: 22000, deals: 15 },
  { date: "May", revenue: 28000, deals: 18 },
  { date: "Jun", revenue: 35000, deals: 22 },
  { date: "Jul", revenue: 32000, deals: 20 },
  { date: "Aug", revenue: 42000, deals: 26 },
  { date: "Sep", revenue: 38000, deals: 24 },
  { date: "Oct", revenue: 48000, deals: 30 },
  { date: "Nov", revenue: 52000, deals: 32 },
  { date: "Dec", revenue: 58000, deals: 36 },
]

export function RevenueChart({ dateRange }: RevenueChartProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Revenue Overview</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue trend</p>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
