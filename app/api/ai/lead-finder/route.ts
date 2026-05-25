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
    system: `You are an AI Lead Finder Agent for a CRM system. Your job is to help the user find leads in their database based on their criteria.

You have access to tools to search the database. When the user asks about leads, use the appropriate tool to fetch data.

Be concise but helpful. Format lead information clearly. When presenting leads, include:
- Name, email, company
- Lead score (0-100)
- Status
- Location if available
- Source

Always provide actionable insights about the leads you find.`,
    messages: await convertToModelMessages(messages),
    tools: {
      searchLeads: tool({
        description: 'Search for leads in the database with filters',
        inputSchema: z.object({
          status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).optional().describe('Filter by lead status'),
          leadType: z.enum(['b2b', 'b2c']).optional().describe('Filter by lead type'),
          minScore: z.number().optional().describe('Minimum lead score'),
          location: z.string().optional().describe('Filter by location'),
          industry: z.string().optional().describe('Filter by industry'),
          limit: z.number().optional().default(10).describe('Number of results to return'),
        }),
        execute: async ({ status, leadType, minScore, location, industry, limit }) => {
          let query = supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('lead_score', { ascending: false })
            .limit(limit || 10)

          if (status) query = query.eq('status', status)
          if (leadType) query = query.eq('lead_type', leadType)
          if (minScore) query = query.gte('lead_score', minScore)
          if (location) query = query.ilike('location', `%${location}%`)
          if (industry) query = query.ilike('industry', `%${industry}%`)

          const { data, error } = await query

          if (error) return { error: error.message }
          return { leads: data || [], count: data?.length || 0 }
        },
      }),
      getLeadStats: tool({
        description: 'Get statistics about leads in the database',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: leads } = await supabase
            .from('leads')
            .select('status, lead_type, lead_score, source')
            .eq('user_id', user.id)

          if (!leads || leads.length === 0) {
            return { message: 'No leads found in database' }
          }

          const stats = {
            total: leads.length,
            byStatus: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            avgScore: 0,
          }

          let totalScore = 0
          leads.forEach(lead => {
            stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1
            stats.byType[lead.lead_type] = (stats.byType[lead.lead_type] || 0) + 1
            if (lead.source) {
              stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1
            }
            totalScore += lead.lead_score || 0
          })
          stats.avgScore = Math.round(totalScore / leads.length)

          return stats
        },
      }),
      getHighValueLeads: tool({
        description: 'Get the highest scoring leads that need attention',
        inputSchema: z.object({
          limit: z.number().optional().default(5),
        }),
        execute: async ({ limit }) => {
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['new', 'contacted'])
            .gte('lead_score', 70)
            .order('lead_score', { ascending: false })
            .limit(limit || 5)

          return { highValueLeads: data || [] }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
