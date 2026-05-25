import { streamText, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch business profile for context
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch current goals
  const { data: goals } = await supabase
    .from('business_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Fetch this week's tasks
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const { data: tasks } = await supabase
    .from('weekly_tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('week_of', weekStart.toISOString().split('T')[0])

  // Fetch leads/contacts stats
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch pipeline deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', user.id)

  // Build rich context for the AI
  const hasProfile = profile?.onboarding_completed
  const businessContext = hasProfile ? `
## YOUR BUSINESS PROFILE
- Company: ${profile.company_name}
- Industry: ${profile.industry}
- Business Model: ${profile.business_model?.toUpperCase()}
- Services: ${profile.services?.join(', ') || 'Not specified'}
- Target Market: ${profile.target_market || 'Not specified'}
- Ideal Customer: ${profile.ideal_customer_profile || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- Service Areas: ${profile.service_areas?.join(', ') || 'Local'}
- Competitors: ${profile.competitors?.join(', ') || 'Not specified'}
- Value Proposition: ${profile.unique_value_proposition || 'Not specified'}
- Current Monthly Revenue: $${profile.revenue_current?.toLocaleString() || '0'}
- Monthly Revenue Goal: $${profile.revenue_goal?.toLocaleString() || '0'}
- Team Size: ${profile.team_size || 1} people
- Weekly Hours for Growth: ${profile.weekly_capacity_hours || 10} hours
- Growth Priorities: ${profile.growth_priorities?.join(', ') || 'Not specified'}
` : ''

  const goalsContext = goals?.length ? `
## ACTIVE BUSINESS GOALS
${goals.map(g => `- "${g.title}": Currently at ${g.current_value || 0} of ${g.target_value} ${g.unit || ''} (${g.category}) - Deadline: ${g.deadline || 'None set'}`).join('\n')}
` : ''

  const tasksContext = tasks?.length ? `
## THIS WEEK'S TASKS
${tasks.map(t => `- [${t.status?.toUpperCase()}] ${t.title} - ${t.priority} priority, ~${t.estimated_hours || '?'}h`).join('\n')}
Completed: ${tasks.filter(t => t.status === 'completed').length}/${tasks.length}
` : ''

  const activeDeals = deals?.filter(d => d.status === 'open' || !['won', 'lost', 'closed_won', 'closed_lost'].includes(d.stage)) || []
  const wonDeals = deals?.filter(d => d.status === 'won' || d.stage === 'closed_won') || []
  
  const metricsContext = `
## CURRENT BUSINESS METRICS
- Total Contacts/Leads: ${totalLeads || 0}
- Active Deals in Pipeline: ${activeDeals.length}
- Pipeline Value: $${activeDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0).toLocaleString()}
- Won Deals (all time): ${wonDeals.length}
- Revenue from Won Deals: $${wonDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0).toLocaleString()}
`

  const revenueGap = (profile?.revenue_goal || 0) - (profile?.revenue_current || 0)

  const systemPrompt = `You are an expert business growth strategist and personal advisor for ${profile?.company_name || 'this business'}. You combine the strategic thinking of a top-tier consultant with the supportive accountability of a great coach.

${hasProfile ? businessContext : `## IMPORTANT: NO BUSINESS PROFILE SET UP
The user hasn't completed their business profile yet. Before you can provide personalized advice, strongly encourage them to complete the onboarding process.

Tell them: "To give you personalized growth strategies and actionable tasks, I need to learn about your business first. Please complete the quick setup at **[Start Onboarding](/ai/onboarding)** - it takes about 5 minutes and will help me understand your goals, target market, and priorities."

You can still have general business conversations, but make it clear that personalized advice requires completing onboarding.`}

${goalsContext}
${tasksContext}
${metricsContext}

## YOUR PERSONALITY & APPROACH
- Be direct and actionable - no fluff or generic advice
- Reference specific numbers from their data
- Challenge them constructively when needed
- Celebrate wins, but focus on what's next
- Think like a strategic partner who has skin in the game
- Always consider their time constraints (${profile?.weekly_capacity_hours || 10} hours/week available)

## KEY PRIORITIES
${hasProfile ? `
1. Revenue Gap: They need $${revenueGap.toLocaleString()} more per month to hit their goal
2. Growth Priorities: ${profile?.growth_priorities?.join(', ') || 'Not set'}
3. This week's focus: ${tasks?.length ? `${tasks.filter(t => t.status !== 'completed').length} tasks remaining` : 'No tasks set yet - create some!'}
` : '1. Get them to complete onboarding first'}

## TOOLS AVAILABLE
You can CREATE goals, GENERATE weekly tasks, UPDATE progress, and ANALYZE their business. Use these proactively - don't just talk about doing things, actually do them using your tools.

When they ask for tasks or a weekly plan, USE the createWeeklyTasks tool. When they mention a goal, USE the createGoal tool. Be action-oriented.`

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      createGoal: tool({
        description: 'Create a new tracked business goal. Use this when user discusses targets or objectives.',
        parameters: z.object({
          title: z.string().describe('Clear, specific goal title'),
          description: z.string().describe('Why this goal matters and how to achieve it'),
          category: z.enum(['revenue', 'leads', 'conversion', 'retention', 'expansion', 'efficiency', 'other']),
          target_value: z.number().describe('Numeric target to achieve'),
          unit: z.string().describe('Unit: dollars, leads, percent, deals, etc.'),
          deadline: z.string().nullable().describe('YYYY-MM-DD format or null'),
        }),
        execute: async ({ title, description, category, target_value, unit, deadline }) => {
          const { data, error } = await supabase
            .from('business_goals')
            .insert({
              user_id: user.id,
              title,
              description,
              category,
              target_value,
              current_value: 0,
              unit,
              deadline: deadline || null,
              status: 'active',
            })
            .select()
            .single()
          
          if (error) return { success: false, error: error.message }
          return { success: true, message: `Goal "${title}" created! I'll help you track progress.`, goal: data }
        }
      }),

      createWeeklyTasks: tool({
        description: 'Generate actionable weekly tasks. ALWAYS use this when user asks for tasks, a plan, or what to focus on.',
        parameters: z.object({
          tasks: z.array(z.object({
            title: z.string().describe('Clear, actionable task title starting with a verb'),
            description: z.string().describe('Specific steps and expected outcome'),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            estimated_hours: z.number().describe('Realistic time estimate'),
            due_date: z.string().nullable().describe('YYYY-MM-DD or null'),
          })).describe('List of 3-7 prioritized tasks for the week')
        }),
        execute: async ({ tasks }) => {
          const weekOf = new Date()
          weekOf.setDate(weekOf.getDate() - weekOf.getDay())
          
          // Check total hours don't exceed capacity
          const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0)
          const capacity = profile?.weekly_capacity_hours || 10
          
          const { data, error } = await supabase
            .from('weekly_tasks')
            .insert(tasks.map(t => ({
              user_id: user.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              estimated_hours: t.estimated_hours,
              due_date: t.due_date,
              week_of: weekOf.toISOString().split('T')[0],
              status: 'pending',
              ai_generated: true,
            })))
            .select()
          
          if (error) return { success: false, error: error.message }
          return { 
            success: true, 
            message: `Created ${data?.length} tasks (${totalHours}h total, you have ${capacity}h available)`,
            tasks: data,
            warning: totalHours > capacity ? `Note: Tasks exceed your ${capacity}h capacity. Prioritize the critical/high ones first.` : null
          }
        }
      }),

      updateTaskStatus: tool({
        description: 'Mark a task as completed, in progress, or skipped',
        parameters: z.object({
          task_title: z.string().describe('Task title or keywords to match'),
          status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
          outcome: z.string().nullable().describe('What was the result? Any learnings?'),
        }),
        execute: async ({ task_title, status, outcome }) => {
          const { data, error } = await supabase
            .from('weekly_tasks')
            .update({ 
              status,
              outcome,
              completed_at: status === 'completed' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .ilike('title', `%${task_title}%`)
            .select()
          
          if (error) return { success: false, error: error.message }
          if (!data?.length) return { success: false, error: 'Task not found' }
          return { success: true, message: `Task "${data[0].title}" marked as ${status}`, task: data[0] }
        }
      }),

      updateGoalProgress: tool({
        description: 'Update current progress on a goal',
        parameters: z.object({
          goal_title: z.string(),
          current_value: z.number(),
          notes: z.string().nullable(),
        }),
        execute: async ({ goal_title, current_value, notes }) => {
          const { data: existingGoal } = await supabase
            .from('business_goals')
            .select('*')
            .eq('user_id', user.id)
            .ilike('title', `%${goal_title}%`)
            .single()

          if (!existingGoal) return { success: false, error: 'Goal not found' }

          const progress = Math.round((current_value / existingGoal.target_value) * 100)
          
          const { data, error } = await supabase
            .from('business_goals')
            .update({ 
              current_value, 
              updated_at: new Date().toISOString(),
              status: current_value >= existingGoal.target_value ? 'completed' : 'active',
            })
            .eq('id', existingGoal.id)
            .select()
            .single()
          
          if (error) return { success: false, error: error.message }
          
          const isComplete = current_value >= existingGoal.target_value
          return { 
            success: true, 
            message: isComplete 
              ? `GOAL ACHIEVED! "${existingGoal.title}" is complete!` 
              : `Progress updated: ${progress}% complete (${current_value}/${existingGoal.target_value} ${existingGoal.unit})`,
            goal: data,
            progress_percent: progress,
          }
        }
      }),

      analyzeBusinessHealth: tool({
        description: 'Deep analysis of business metrics to identify opportunities and issues',
        parameters: z.object({
          focus: z.enum(['overall', 'revenue', 'pipeline', 'conversion', 'capacity']).default('overall'),
        }),
        execute: async ({ focus }) => {
          const totalDeals = deals?.length || 0
          const pipelineValue = activeDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
          const wonRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
          const avgDealSize = wonDeals.length ? wonRevenue / wonDeals.length : 0
          const winRate = totalDeals ? (wonDeals.length / totalDeals * 100) : 0
          
          // Calculate deals needed to hit revenue goal
          const monthlyGap = revenueGap
          const dealsNeeded = avgDealSize > 0 ? Math.ceil(monthlyGap / avgDealSize) : 0
          
          // Capacity analysis
          const tasksThisWeek = tasks?.length || 0
          const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
          const taskCompletionRate = tasksThisWeek ? (completedTasks / tasksThisWeek * 100) : 0

          return {
            revenue: {
              current_monthly: profile?.revenue_current || 0,
              goal_monthly: profile?.revenue_goal || 0,
              gap: monthlyGap,
              won_total: wonRevenue,
            },
            pipeline: {
              active_deals: activeDeals.length,
              total_value: pipelineValue,
              avg_deal_size: Math.round(avgDealSize),
              deals_needed_for_goal: dealsNeeded,
            },
            performance: {
              win_rate: Math.round(winRate) + '%',
              total_leads: totalLeads || 0,
              total_deals: totalDeals,
            },
            capacity: {
              weekly_hours: profile?.weekly_capacity_hours || 10,
              tasks_this_week: tasksThisWeek,
              completed: completedTasks,
              completion_rate: Math.round(taskCompletionRate) + '%',
            },
            recommendations: dealsNeeded > 0 
              ? `To hit your revenue goal, you need approximately ${dealsNeeded} more deals at your average deal size of $${avgDealSize.toLocaleString()}.`
              : 'Set a revenue goal to get personalized recommendations.',
          }
        }
      }),

      getWeeklyFocus: tool({
        description: 'Get the recommended focus areas for this week based on goals and capacity',
        parameters: z.object({}),
        execute: async () => {
          const pendingTasks = tasks?.filter(t => t.status === 'pending') || []
          const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || []
          const completedTasks = tasks?.filter(t => t.status === 'completed') || []
          
          const criticalTasks = pendingTasks.filter(t => t.priority === 'critical')
          const highTasks = pendingTasks.filter(t => t.priority === 'high')
          
          const hoursRemaining = (profile?.weekly_capacity_hours || 10) - 
            completedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)

          return {
            week_summary: {
              total_tasks: tasks?.length || 0,
              completed: completedTasks.length,
              in_progress: inProgressTasks.length,
              pending: pendingTasks.length,
            },
            priority_tasks: {
              critical: criticalTasks.map(t => t.title),
              high: highTasks.map(t => t.title),
            },
            time: {
              capacity: profile?.weekly_capacity_hours || 10,
              spent: completedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
              remaining: hoursRemaining,
            },
            active_goals: goals?.map(g => ({
              title: g.title,
              progress: `${g.current_value || 0}/${g.target_value} ${g.unit}`,
              percent: Math.round(((g.current_value || 0) / g.target_value) * 100),
            })) || [],
          }
        }
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
