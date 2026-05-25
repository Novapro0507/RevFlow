"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { LeadSourceChart } from "@/components/analytics/lead-source-chart"
import { ConversionFunnel } from "@/components/analytics/conversion-funnel"
import { TopPerformers } from "@/components/analytics/top-performers"
import { AIRecommendations } from "@/components/analytics/ai-recommendations"

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalDeals: 0,
    totalLeads: 0,
    conversionRate: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)
    
    const { data: deals } = await supabase
      .from("deals")
      .select("value, stage")

    const { data: leads } = await supabase
      .from("leads")
      .select("id, status")

    if (deals && leads) {
      const wonDeals = deals.filter(d => d.stage === "closed_won")
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
      const convertedLeads = leads.filter(l => l.status === "converted").length

      setStats({
        totalRevenue,
        totalDeals: deals.length,
        totalLeads: leads.length,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <AnalyticsHeader 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange}
        stats={stats}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart dateRange={dateRange} />
        <LeadSourceChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConversionFunnel />
        <TopPerformers />
        <AIRecommendations />
      </div>
    </div>
  )
}
