import { streamText, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: `You are an AI Growth Assistant for a business CRM. Your role is to help the user grow their business by:

1. Analyzing their sales data and metrics
2. Providing actionable insights and recommendations
3. Creating weekly task lists based on their goals
4. Identifying bottlenecks in their sales funnel
5. Suggesting strategies to improve conversion rates

When providing tasks, be specific and actionable. Include:
- Priority level (High/Medium/Low)
- Estimated time to complete
- Expected impact

Use the available tools to fetch real data before making recommendations. Base your advice on actual numbers when possible.

Be encouraging but realistic. Focus on high-impact activities.`,
    messages: await convertToModelMessages(messages),
    tools: {
      getDashboardMetrics: tool({
        description: 'Get current business metrics including leads, deals, revenue',
        inputSchema: z.object({}),
        execute: async () => {
          const [leadsResult, dealsResult] = await Promise.all([
            supabase.from('leads').select('*').eq('user_id', user.id),
            supabase.from('deals').select('*').eq('user_id', user.id),
          ])

          const leads = leadsResult.data || []
          const deals = dealsResult.data || []

          const totalLeads = leads.length
          const newLeads = leads.filter(l => l.status === 'new').length
          const qualifiedLeads = leads.filter(l => l.status === 'qualified').length
          
          const totalDeals = deals.length
          const openDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length
          const wonDeals = deals.filter(d => d.stage === 'closed_won').length
          const lostDeals = deals.filter(d => d.stage === 'closed_lost').length
          
          const totalRevenue = deals
            .filter(d => d.stage === 'closed_won')
            .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
          
          const pipelineValue = deals
            .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
            .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)

          const conversionRate = totalLeads > 0 
            ? Math.round((qualifiedLeads / totalLeads) * 100) 
            : 0

          const winRate = (wonDeals + lostDeals) > 0
            ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100)
            : 0

          return {
            leads: { total: totalLeads, new: newLeads, qualified: qualifiedLeads },
            deals: { total: totalDeals, open: openDeals, won: wonDeals, lost: lostDeals },
            revenue: { total: totalRevenue, pipeline: pipelineValue },
            rates: { conversion: conversionRate, win: winRate },
          }
        },
      }),
      analyzeFunnel: tool({
        description: 'Analyze the sales funnel to identify bottlenecks',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: deals } = await supabase
            .from('deals')
            .select('stage, value, created_at, updated_at')
            .eq('user_id', user.id)

          if (!deals || deals.length === 0) {
            return { message: 'No deals found to analyze' }
          }

          const stages = ['lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
          const funnelData = stages.map(stage => ({
            stage,
            count: deals.filter(d => d.stage === stage).length,
            value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
          }))

          // Find bottlenecks (stages with significant drop-offs)
          const bottlenecks = []
          for (let i = 0; i < funnelData.length - 2; i++) {
            const current = funnelData[i].count
            const next = funnelData[i + 1].count
            if (current > 0 && next / current < 0.5) {
              bottlenecks.push({
                from: funnelData[i].stage,
                to: funnelData[i + 1].stage,
                dropOff: Math.round((1 - next / current) * 100),
              })
            }
          }

          return { funnel: funnelData, bottlenecks }
        },
      }),
      generateWeeklyTasks: tool({
        description: 'Generate a prioritized weekly task list based on current metrics',
        inputSchema: z.object({
          focusArea: z.enum(['leads', 'deals', 'revenue', 'all']).optional().default('all'),
        }),
        execute: async ({ focusArea }) => {
          // Fetch current data
          const [leadsResult, dealsResult] = await Promise.all([
            supabase.from('leads').select('*').eq('user_id', user.id),
            supabase.from('deals').select('*').eq('user_id', user.id),
          ])

          const leads = leadsResult.data || []
          const deals = dealsResult.data || []

          const tasks = []

          // Lead-focused tasks
          if (focusArea === 'leads' || focusArea === 'all') {
            const newLeads = leads.filter(l => l.status === 'new').length
            if (newLeads > 0) {
              tasks.push({
                priority: 'High',
                task: `Review and qualify ${newLeads} new leads`,
                timeEstimate: `${Math.ceil(newLeads * 5)} minutes`,
                impact: 'Move leads through pipeline faster',
              })
            }

            const highScoreLeads = leads.filter(l => l.lead_score >= 70 && l.status === 'new').length
            if (highScoreLeads > 0) {
              tasks.push({
                priority: 'High',
                task: `Contact ${highScoreLeads} high-score leads immediately`,
                timeEstimate: `${highScoreLeads * 15} minutes`,
                impact: 'High conversion potential',
              })
            }
          }

          // Deal-focused tasks
          if (focusArea === 'deals' || focusArea === 'all') {
            const staleDeals = deals.filter(d => {
              const updatedAt = new Date(d.updated_at)
              const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
              return daysSinceUpdate > 7 && !['closed_won', 'closed_lost'].includes(d.stage)
            }).length

            if (staleDeals > 0) {
              tasks.push({
                priority: 'Medium',
                task: `Follow up on ${staleDeals} stale deals (no activity in 7+ days)`,
                timeEstimate: `${staleDeals * 10} minutes`,
                impact: 'Prevent deals from going cold',
              })
            }

            const proposalDeals = deals.filter(d => d.stage === 'proposal').length
            if (proposalDeals > 0) {
              tasks.push({
                priority: 'High',
                task: `Follow up on ${proposalDeals} pending proposals`,
                timeEstimate: `${proposalDeals * 15} minutes`,
                impact: 'Close deals faster',
              })
            }
          }

          // Revenue-focused tasks
          if (focusArea === 'revenue' || focusArea === 'all') {
            const bigDeals = deals.filter(d => 
              parseFloat(d.value) >= 10000 && 
              !['closed_won', 'closed_lost'].includes(d.stage)
            ).length

            if (bigDeals > 0) {
              tasks.push({
                priority: 'High',
                task: `Prioritize ${bigDeals} high-value deals in pipeline`,
                timeEstimate: '1-2 hours',
                impact: 'Maximize revenue potential',
              })
            }
          }

          // General tasks
          tasks.push({
            priority: 'Low',
            task: 'Review and clean up contact database',
            timeEstimate: '30 minutes',
            impact: 'Improve data quality',
          })

          return { 
            weeklyTasks: tasks.slice(0, 7),
            totalTasks: tasks.length,
            focusArea,
          }
        },
      }),
      setGoal: tool({
        description: 'Help set a business goal with milestones',
        inputSchema: z.object({
          goalType: z.enum(['revenue', 'leads', 'conversion', 'deals']),
          targetValue: z.number(),
          timeframeDays: z.number().default(30),
        }),
        execute: async ({ goalType, targetValue, timeframeDays }) => {
          // Get current metrics for baseline
          const [leadsResult, dealsResult] = await Promise.all([
            supabase.from('leads').select('*').eq('user_id', user.id),
            supabase.from('deals').select('*').eq('user_id', user.id),
          ])

          const leads = leadsResult.data || []
          const deals = dealsResult.data || []

          let currentValue = 0
          let unit = ''

          switch (goalType) {
            case 'revenue':
              currentValue = deals
                .filter(d => d.stage === 'closed_won')
                .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
              unit = 'dollars'
              break
            case 'leads':
              currentValue = leads.length
              unit = 'leads'
              break
            case 'conversion':
              const qualified = leads.filter(l => l.status === 'qualified').length
              currentValue = leads.length > 0 ? Math.round((qualified / leads.length) * 100) : 0
              unit = 'percent'
              break
            case 'deals':
              currentValue = deals.filter(d => d.stage === 'closed_won').length
              unit = 'deals'
              break
          }

          const gap = targetValue - currentValue
          const dailyTarget = gap / timeframeDays
          const weeklyTarget = dailyTarget * 7

          return {
            goal: { type: goalType, target: targetValue, unit, timeframeDays },
            current: currentValue,
            gap,
            milestones: {
              daily: Math.ceil(dailyTarget),
              weekly: Math.ceil(weeklyTarget),
            },
          }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
