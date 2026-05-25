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

  const hasProfile = profile?.onboarding_completed

  const systemPrompt = `You are an expert Lead Finder Agent specialized in prospecting and lead generation for ${profile?.company_name || 'businesses'}.

${hasProfile ? `
## BUSINESS CONTEXT
- Company: ${profile.company_name}
- Industry: ${profile.industry}
- Business Model: ${profile.business_model?.toUpperCase()}
- Services: ${profile.services?.join(', ')}
- Target Market: ${profile.target_market}
- Ideal Customer Profile: ${profile.ideal_customer_profile}
- Service Areas: ${profile.service_areas?.join(', ') || profile.location}
- Competitors: ${profile.competitors?.join(', ')}

## YOUR MISSION
Find leads that match this business's ideal customer profile. Focus on:
1. Companies/people in their target market
2. Located in their service areas
3. Who need their services: ${profile.services?.join(', ')}
` : `
## NO BUSINESS PROFILE
The user hasn't completed their business profile. Encourage them to complete onboarding at /ai/onboarding to get personalized lead recommendations.
`}

## CAPABILITIES
1. **Search Existing Leads**: Query the CRM database for leads matching criteria
2. **Find New Prospects**: Use web search to discover potential leads online
3. **Analyze Lead Quality**: Score and prioritize leads based on fit
4. **Generate Lead Lists**: Create targeted prospect lists for outreach

## LEAD SEARCH STRATEGIES
When the user asks to find leads, consider:
- Industry/vertical targeting
- Geographic targeting (their service areas)
- Company size / revenue targeting for B2B
- Job title targeting for decision makers
- Intent signals (companies actively looking for their services)
- Competitor customers (potential switch targets)

## RESPONSE FORMAT
When presenting leads or prospects, always include:
- Name / Company name
- Why they're a good fit
- Contact info if available
- Recommended approach
- Priority score (1-10)

Be proactive - don't just wait for criteria, suggest strategies based on their ideal customer profile.`

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      searchExistingLeads: tool({
        description: 'Search for leads already in the CRM database',
        parameters: z.object({
          status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).nullable().describe('Filter by status'),
          minScore: z.number().nullable().describe('Minimum lead score 0-100'),
          location: z.string().nullable().describe('City, state, or region'),
          industry: z.string().nullable().describe('Industry vertical'),
          source: z.string().nullable().describe('Lead source'),
          limit: z.number().default(20).describe('Max results'),
        }),
        execute: async ({ status, minScore, location, industry, source, limit }) => {
          let query = supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('lead_score', { ascending: false })
            .limit(limit)

          if (status) query = query.eq('status', status)
          if (minScore) query = query.gte('lead_score', minScore)
          if (location) query = query.ilike('location', `%${location}%`)
          if (industry) query = query.ilike('industry', `%${industry}%`)
          if (source) query = query.ilike('source', `%${source}%`)

          const { data, error } = await query
          if (error) return { error: error.message }
          
          return { 
            leads: data || [], 
            count: data?.length || 0,
            message: data?.length ? `Found ${data.length} leads matching criteria` : 'No leads found with those criteria'
          }
        },
      }),

      getLeadStatistics: tool({
        description: 'Get overview statistics of all leads in the database',
        parameters: z.object({}),
        execute: async () => {
          const { data: leads } = await supabase
            .from('leads')
            .select('status, lead_type, lead_score, source, industry, location, created_at')
            .eq('user_id', user.id)

          if (!leads || leads.length === 0) {
            return { 
              total: 0, 
              message: 'No leads in database yet. Use web search to find new prospects or add leads manually.' 
            }
          }

          const stats = {
            total: leads.length,
            byStatus: {} as Record<string, number>,
            byIndustry: {} as Record<string, number>,
            bySource: {} as Record<string, number>,
            topLocations: {} as Record<string, number>,
            avgScore: 0,
            highScoreCount: 0,
            recentLeads: 0,
          }

          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          let totalScore = 0

          leads.forEach(lead => {
            stats.byStatus[lead.status || 'unknown'] = (stats.byStatus[lead.status || 'unknown'] || 0) + 1
            if (lead.industry) stats.byIndustry[lead.industry] = (stats.byIndustry[lead.industry] || 0) + 1
            if (lead.source) stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1
            if (lead.location) stats.topLocations[lead.location] = (stats.topLocations[lead.location] || 0) + 1
            totalScore += lead.lead_score || 0
            if (lead.lead_score >= 70) stats.highScoreCount++
            if (new Date(lead.created_at) > oneWeekAgo) stats.recentLeads++
          })

          stats.avgScore = Math.round(totalScore / leads.length)

          return stats
        },
      }),

      findHotLeads: tool({
        description: 'Find the highest priority leads that need immediate attention',
        parameters: z.object({
          limit: z.number().default(10),
        }),
        execute: async ({ limit }) => {
          const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['new', 'contacted'])
            .gte('lead_score', 60)
            .order('lead_score', { ascending: false })
            .limit(limit)

          return { 
            hotLeads: data || [], 
            count: data?.length || 0,
            action: 'These leads have high scores and are waiting for follow-up. Prioritize reaching out to them.' 
          }
        },
      }),

      webSearchForLeads: tool({
        description: 'Search the web to find new potential leads and prospects. Use this to discover companies or people who might need the services.',
        parameters: z.object({
          searchQuery: z.string().describe('Search query to find prospects (e.g., "HVAC companies in Houston", "real estate agents Miami")'),
          intent: z.enum(['companies', 'people', 'job_postings', 'reviews', 'news']).describe('What type of leads to find'),
        }),
        execute: async ({ searchQuery, intent }) => {
          // Build a targeted search query based on intent
          let enhancedQuery = searchQuery
          switch (intent) {
            case 'companies':
              enhancedQuery = `${searchQuery} company business`
              break
            case 'people':
              enhancedQuery = `${searchQuery} contact email linkedin`
              break
            case 'job_postings':
              enhancedQuery = `${searchQuery} hiring jobs careers`
              break
            case 'reviews':
              enhancedQuery = `${searchQuery} reviews complaints needs help`
              break
            case 'news':
              enhancedQuery = `${searchQuery} news expansion growing funding`
              break
          }

          // Note: In production, you'd integrate with Apollo.io, LinkedIn Sales Navigator, 
          // or other lead databases. For now, we provide guidance.
          return {
            searchQuery: enhancedQuery,
            strategy: `To find these leads, I recommend:
            
1. **LinkedIn Sales Navigator** - Search for: "${searchQuery}"
   - Filter by location: ${profile?.service_areas?.join(', ') || 'your service areas'}
   - Filter by industry: ${profile?.industry || 'relevant industries'}
   - Look for decision makers

2. **Google Maps** - Search "${searchQuery}" to find local businesses
   - Check reviews for businesses that might need your services
   - Note contact info from Google Business profiles

3. **Industry Directories** - Search industry-specific directories for ${profile?.industry || 'your industry'}

4. **Social Media** - Search Twitter/X, Facebook for people discussing needs related to: ${profile?.services?.join(', ') || 'your services'}

5. **Job Boards** - Companies hiring for roles related to your services often need help`,
            recommendedTools: [
              'Apollo.io - B2B lead database with 275M+ contacts',
              'LinkedIn Sales Navigator - Decision maker targeting', 
              'ZoomInfo - Company intelligence',
              'Hunter.io - Email finding',
              'Clearbit - Company enrichment'
            ],
            idealCustomerReminder: profile?.ideal_customer_profile || 'Complete your business profile to get personalized recommendations',
          }
        },
      }),

      addLeadToDatabase: tool({
        description: 'Add a new lead/prospect to the CRM database',
        parameters: z.object({
          first_name: z.string(),
          last_name: z.string(),
          email: z.string().nullable(),
          phone: z.string().nullable(),
          company: z.string().nullable(),
          title: z.string().nullable(),
          industry: z.string().nullable(),
          location: z.string().nullable(),
          source: z.string().describe('Where did this lead come from?'),
          notes: z.string().nullable(),
          lead_score: z.number().min(0).max(100).default(50),
        }),
        execute: async ({ first_name, last_name, email, phone, company, title, industry, location, source, notes, lead_score }) => {
          const { data, error } = await supabase
            .from('leads')
            .insert({
              user_id: user.id,
              first_name,
              last_name,
              email,
              phone,
              company,
              title,
              industry,
              location,
              source,
              notes,
              lead_score,
              status: 'new',
              lead_type: profile?.business_model || 'b2b',
            })
            .select()
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, message: `Added ${first_name} ${last_name} to your leads!`, lead: data }
        },
      }),

      suggestProspectingStrategy: tool({
        description: 'Get a customized prospecting strategy based on the business profile',
        parameters: z.object({}),
        execute: async () => {
          if (!hasProfile) {
            return { 
              error: 'No business profile found',
              action: 'Complete your business profile at /ai/onboarding to get a personalized prospecting strategy'
            }
          }

          const strategies = []
          
          // Industry-specific strategies
          if (profile.industry) {
            strategies.push({
              channel: 'Industry Events & Associations',
              tactic: `Join ${profile.industry} associations and attend trade shows. These are goldmines for finding decision makers.`,
              priority: 'high'
            })
          }

          // Location-based strategies
          if (profile.service_areas?.length) {
            strategies.push({
              channel: 'Local SEO & Google Maps',
              tactic: `Optimize for "${profile.services?.[0]} in ${profile.service_areas[0]}" searches. Claim and optimize Google Business profile.`,
              priority: 'high'
            })
          }

          // B2B vs B2C strategies
          if (profile.business_model === 'b2b') {
            strategies.push({
              channel: 'LinkedIn Outreach',
              tactic: `Connect with ${profile.target_market} on LinkedIn. Share valuable content about ${profile.services?.join(', ')}.`,
              priority: 'high'
            })
            strategies.push({
              channel: 'Cold Email',
              tactic: 'Build targeted lists using Apollo.io or ZoomInfo. Personalize based on company triggers (funding, hiring, expansion).',
              priority: 'medium'
            })
          } else {
            strategies.push({
              channel: 'Social Media Ads',
              tactic: `Run targeted Facebook/Instagram ads to ${profile.target_market} in ${profile.service_areas?.join(', ')}`,
              priority: 'high'
            })
            strategies.push({
              channel: 'Referral Program',
              tactic: 'Create a referral program offering incentives to existing customers for introductions.',
              priority: 'high'
            })
          }

          // Competitor strategies
          if (profile.competitors?.length) {
            strategies.push({
              channel: 'Competitor Analysis',
              tactic: `Monitor ${profile.competitors.join(', ')} for unhappy customers. Check their reviews for people who might switch.`,
              priority: 'medium'
            })
          }

          return {
            targetMarket: profile.target_market,
            idealCustomer: profile.ideal_customer_profile,
            serviceAreas: profile.service_areas,
            strategies,
            weeklyProspectingPlan: `With ${profile.weekly_capacity_hours || 10} hours/week available:
- 3 hours: LinkedIn outreach and engagement
- 2 hours: Following up with warm leads
- 2 hours: Content creation and social posting  
- 2 hours: Networking and referral asks
- 1 hour: Reviewing and qualifying new inbound leads`
          }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
