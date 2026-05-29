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

  const systemPrompt = `You are an expert Property Lead Finder Agent specialized in finding homeowners who need exterior home services for ${profile?.company_name || 'home service businesses'}.

${hasProfile ? `
## BUSINESS CONTEXT
- Company: ${profile.company_name}
- Industry: ${profile.industry}
- Services: ${profile.services?.join(', ')}
- Target Market: ${profile.target_market}
- Ideal Customer Profile: ${profile.ideal_customer_profile}
- Service Areas: ${profile.service_areas?.join(', ') || profile.location}
` : `
## NO BUSINESS PROFILE
Complete onboarding at /ai/onboarding for personalized property lead recommendations.
`}

## YOUR SPECIALIZATION
You analyze property data to find homeowners who are most likely to need exterior home services:
- **Roof Age Analysis**: Homes with roofs 15+ years old need replacement
- **Exterior Condition Scoring**: Lower scores = higher need for services
- **Home Value Targeting**: Higher value homes = larger potential tickets
- **Year Built Analysis**: Older homes need more maintenance
- **Geographic Clustering**: Find neighborhoods with high-need properties

## DATA SOURCES EXPLAINED
1. **County Records**: Owner names, property details, tax assessments, sale history
2. **Zillow-Style Data**: Home values, estimates, property specs
3. **Visual Analysis**: Exterior condition scores from satellite/street view imagery

## LEAD SCORING CRITERIA
Score properties 0-100 based on:
- Roof age (15+ years = +30 points)
- Exterior condition score (lower = more points)
- Home value (higher = more points, can afford services)
- Time since last sale (5+ years = established homeowner = +10 points)
- Property type (single family preferred = +10 points)

## RESPONSE FORMAT
When presenting property leads:
- Address and owner name
- Home value and year built
- Exterior condition score with explanation
- AI service recommendation
- Estimated ticket size
- Why they're a good lead

Be proactive - suggest searches based on high-opportunity criteria like old roofs, poor exterior conditions, or high-value homes in their service areas.`

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      searchPropertyLeads: tool({
        description: 'Search property leads database with filters for home value, year built, condition, location, etc.',
        parameters: z.object({
          city: z.string().nullable().describe('Filter by city'),
          zipCode: z.string().nullable().describe('Filter by ZIP code'),
          minHomeValue: z.number().nullable().describe('Minimum home value'),
          maxHomeValue: z.number().nullable().describe('Maximum home value'),
          maxYearBuilt: z.number().nullable().describe('Properties built before this year (for older homes)'),
          maxConditionScore: z.number().nullable().describe('Max exterior condition score (lower = worse condition = better lead)'),
          minLeadScore: z.number().nullable().describe('Minimum lead score 0-100'),
          propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'other']).nullable().describe('Property type filter'),
          outreachStatus: z.enum(['not_contacted', 'contacted', 'callback_scheduled', 'quote_sent', 'won', 'lost', 'not_interested']).nullable().describe('Outreach status filter'),
          sortBy: z.enum(['lead_score', 'home_value', 'exterior_condition_score', 'year_built', 'estimated_ticket']).describe('Sort results by this field'),
          sortOrder: z.enum(['asc', 'desc']).describe('Sort direction'),
          limit: z.number().describe('Max results to return'),
        }),
        execute: async ({ city, zipCode, minHomeValue, maxHomeValue, maxYearBuilt, maxConditionScore, minLeadScore, propertyType, outreachStatus, sortBy, sortOrder, limit }) => {
          let query = supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)

          if (city) query = query.ilike('city', `%${city}%`)
          if (zipCode) query = query.eq('zip_code', zipCode)
          if (minHomeValue) query = query.gte('home_value', minHomeValue)
          if (maxHomeValue) query = query.lte('home_value', maxHomeValue)
          if (maxYearBuilt) query = query.lte('year_built', maxYearBuilt)
          if (maxConditionScore) query = query.lte('exterior_condition_score', maxConditionScore)
          if (minLeadScore) query = query.gte('lead_score', minLeadScore)
          if (propertyType) query = query.eq('property_type', propertyType)
          if (outreachStatus) query = query.eq('outreach_status', outreachStatus)

          query = query.order(sortBy, { ascending: sortOrder === 'asc' }).limit(limit)

          const { data, error } = await query
          if (error) return { error: error.message }
          
          return { 
            properties: data || [], 
            count: data?.length || 0,
            message: data?.length ? `Found ${data.length} properties matching your criteria` : 'No properties found. Try adjusting your filters or import more property data.'
          }
        },
      }),

      getPropertyStatistics: tool({
        description: 'Get overview statistics of all property leads in the database',
        parameters: z.object({
          groupBy: z.enum(['city', 'zip_code', 'property_type', 'outreach_status', 'urgency_level']).describe('How to group the statistics'),
        }),
        execute: async ({ groupBy }) => {
          const { data: properties } = await supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)

          if (!properties || properties.length === 0) {
            return { 
              total: 0, 
              message: 'No property leads in database yet. Import property data via CSV or add properties manually.' 
            }
          }

          const stats = {
            total: properties.length,
            breakdown: {} as Record<string, number>,
            avgHomeValue: 0,
            avgLeadScore: 0,
            avgConditionScore: 0,
            avgEstimatedTicket: 0,
            byUrgency: { immediate: 0, high: 0, medium: 0, low: 0 } as Record<string, number>,
            byOutreach: { not_contacted: 0, contacted: 0, callback_scheduled: 0, quote_sent: 0, won: 0, lost: 0, not_interested: 0 } as Record<string, number>,
            hotLeadsCount: 0,
            totalPipelineValue: 0,
          }

          let totalValue = 0, totalScore = 0, totalCondition = 0, totalTicket = 0
          let valueCount = 0, scoreCount = 0, conditionCount = 0, ticketCount = 0

          properties.forEach(p => {
            // Group by selected field
            const groupValue = p[groupBy] || 'unknown'
            stats.breakdown[groupValue] = (stats.breakdown[groupValue] || 0) + 1

            // Calculate averages
            if (p.home_value) { totalValue += Number(p.home_value); valueCount++ }
            if (p.lead_score) { totalScore += p.lead_score; scoreCount++ }
            if (p.exterior_condition_score) { totalCondition += p.exterior_condition_score; conditionCount++ }
            if (p.estimated_ticket) { totalTicket += Number(p.estimated_ticket); ticketCount++ }

            // Urgency breakdown
            if (p.urgency_level) stats.byUrgency[p.urgency_level]++

            // Outreach breakdown
            if (p.outreach_status) stats.byOutreach[p.outreach_status]++

            // Hot leads (high score, not contacted)
            if (p.lead_score >= 70 && p.outreach_status === 'not_contacted') {
              stats.hotLeadsCount++
            }

            // Pipeline value (quote_sent status)
            if (p.outreach_status === 'quote_sent' && p.estimated_ticket) {
              stats.totalPipelineValue += Number(p.estimated_ticket)
            }
          })

          stats.avgHomeValue = valueCount ? Math.round(totalValue / valueCount) : 0
          stats.avgLeadScore = scoreCount ? Math.round(totalScore / scoreCount) : 0
          stats.avgConditionScore = conditionCount ? Math.round(totalCondition / conditionCount) : 0
          stats.avgEstimatedTicket = ticketCount ? Math.round(totalTicket / ticketCount) : 0

          return stats
        },
      }),

      findHighValueOpportunities: tool({
        description: 'Find properties with the highest revenue potential based on home value, condition, and estimated ticket',
        parameters: z.object({
          minEstimatedTicket: z.number().describe('Minimum estimated ticket/job value'),
          limit: z.number().describe('Max number of opportunities to return'),
        }),
        execute: async ({ minEstimatedTicket, limit }) => {
          const { data } = await supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)
            .eq('outreach_status', 'not_contacted')
            .gte('estimated_ticket', minEstimatedTicket)
            .order('estimated_ticket', { ascending: false })
            .limit(limit)

          const totalValue = data?.reduce((sum, p) => sum + (Number(p.estimated_ticket) || 0), 0) || 0

          return { 
            properties: data || [], 
            count: data?.length || 0,
            totalPotentialRevenue: totalValue,
            message: data?.length 
              ? `Found ${data.length} high-value opportunities worth $${totalValue.toLocaleString()} in potential revenue!`
              : 'No high-value opportunities found. Try lowering the minimum ticket threshold.'
          }
        },
      }),

      findPropertiesByRoofAge: tool({
        description: 'Find properties with old roofs that likely need replacement or repair',
        parameters: z.object({
          minRoofAge: z.number().describe('Minimum roof age in years (15+ is typical replacement age)'),
          city: z.string().nullable().describe('Filter by city'),
          limit: z.number().describe('Max results'),
        }),
        execute: async ({ minRoofAge, city, limit }) => {
          const currentYear = new Date().getFullYear()
          const maxRoofYear = currentYear - minRoofAge

          let query = supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)
            .not('roof_age', 'is', null)
            .gte('roof_age', minRoofAge)
            .order('roof_age', { ascending: false })
            .limit(limit)

          if (city) query = query.ilike('city', `%${city}%`)

          const { data, error } = await query
          if (error) return { error: error.message }

          return {
            properties: data || [],
            count: data?.length || 0,
            avgRoofAge: data?.length ? Math.round(data.reduce((sum, p) => sum + (p.roof_age || 0), 0) / data.length) : 0,
            message: data?.length 
              ? `Found ${data.length} properties with roofs ${minRoofAge}+ years old - prime candidates for roof services!`
              : 'No properties found with roofs that old. Try lowering the minimum age.'
          }
        },
      }),

      findPoorConditionProperties: tool({
        description: 'Find properties with poor exterior condition scores that need work',
        parameters: z.object({
          maxConditionScore: z.number().describe('Maximum condition score (0-100, lower = worse condition)'),
          serviceType: z.string().nullable().describe('Type of service to recommend'),
          limit: z.number().describe('Max results'),
        }),
        execute: async ({ maxConditionScore, serviceType, limit }) => {
          let query = supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)
            .lte('exterior_condition_score', maxConditionScore)
            .order('exterior_condition_score', { ascending: true })
            .limit(limit)

          if (serviceType) {
            query = query.ilike('ai_service_recommendation', `%${serviceType}%`)
          }

          const { data, error } = await query
          if (error) return { error: error.message }

          return {
            properties: data || [],
            count: data?.length || 0,
            avgConditionScore: data?.length ? Math.round(data.reduce((sum, p) => sum + (p.exterior_condition_score || 0), 0) / data.length) : 0,
            message: data?.length 
              ? `Found ${data.length} properties with exterior condition scores below ${maxConditionScore} - they need your services!`
              : 'No poor condition properties found. Your market may have well-maintained homes.'
          }
        },
      }),

      addPropertyLead: tool({
        description: 'Add a new property lead to the database',
        parameters: z.object({
          full_address: z.string().describe('Full street address'),
          city: z.string().describe('City'),
          state: z.string().describe('State (2-letter code)'),
          zip_code: z.string().describe('ZIP code'),
          owner_name: z.string().nullable().describe('Property owner name'),
          home_value: z.number().nullable().describe('Estimated home value'),
          year_built: z.number().nullable().describe('Year the home was built'),
          property_type: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'land', 'other']).describe('Type of property'),
          exterior_condition_score: z.number().nullable().describe('Exterior condition score 0-100'),
          ai_service_recommendation: z.string().nullable().describe('Recommended service based on property analysis'),
          lead_score: z.number().describe('Lead score 0-100'),
          estimated_ticket: z.number().nullable().describe('Estimated job value'),
          email: z.string().nullable().describe('Owner email if known'),
          phone: z.string().nullable().describe('Owner phone if known'),
          notes: z.string().nullable().describe('Additional notes'),
        }),
        execute: async (params) => {
          const { data, error } = await supabase
            .from('property_leads')
            .insert({
              user_id: user.id,
              ...params,
              outreach_status: 'not_contacted',
              data_sources: ['manual_entry'],
            })
            .select()
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, message: `Added property at ${params.full_address} to your leads!`, property: data }
        },
      }),

      updatePropertyStatus: tool({
        description: 'Update the outreach status of a property lead',
        parameters: z.object({
          propertyId: z.string().describe('Property lead ID'),
          outreachStatus: z.enum(['not_contacted', 'contacted', 'callback_scheduled', 'quote_sent', 'won', 'lost', 'not_interested']).describe('New outreach status'),
          notes: z.string().nullable().describe('Notes about the status change'),
          followUpDate: z.string().nullable().describe('Follow-up date (YYYY-MM-DD format)'),
        }),
        execute: async ({ propertyId, outreachStatus, notes, followUpDate }) => {
          const updateData: Record<string, unknown> = {
            outreach_status: outreachStatus,
            updated_at: new Date().toISOString(),
          }

          if (outreachStatus !== 'not_contacted') {
            updateData.last_contacted_at = new Date().toISOString()
          }

          if (notes) {
            updateData.notes = notes
          }

          if (followUpDate) {
            updateData.follow_up_date = followUpDate
          }

          const { data, error } = await supabase
            .from('property_leads')
            .update(updateData)
            .eq('id', propertyId)
            .eq('user_id', user.id)
            .select()
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, message: `Updated property status to "${outreachStatus}"`, property: data }
        },
      }),

      analyzeNeighborhood: tool({
        description: 'Analyze property data for a specific ZIP code or city to find patterns and opportunities',
        parameters: z.object({
          zipCode: z.string().nullable().describe('ZIP code to analyze'),
          city: z.string().nullable().describe('City to analyze'),
        }),
        execute: async ({ zipCode, city }) => {
          let query = supabase
            .from('property_leads')
            .select('*')
            .eq('user_id', user.id)

          if (zipCode) query = query.eq('zip_code', zipCode)
          if (city) query = query.ilike('city', `%${city}%`)

          const { data: properties } = await query

          if (!properties || properties.length === 0) {
            return {
              message: `No property data found for ${zipCode || city}. Import property data for this area to get insights.`
            }
          }

          const analysis = {
            totalProperties: properties.length,
            avgHomeValue: 0,
            avgYearBuilt: 0,
            avgConditionScore: 0,
            avgLeadScore: 0,
            totalEstimatedRevenue: 0,
            propertyTypeBreakdown: {} as Record<string, number>,
            urgencyBreakdown: { immediate: 0, high: 0, medium: 0, low: 0 } as Record<string, number>,
            topOpportunities: [] as Array<{address: string, score: number, ticket: number, recommendation: string}>,
            insights: [] as string[],
          }

          let valueSum = 0, yearSum = 0, conditionSum = 0, scoreSum = 0
          let valueCount = 0, yearCount = 0, conditionCount = 0, scoreCount = 0

          properties.forEach(p => {
            if (p.home_value) { valueSum += Number(p.home_value); valueCount++ }
            if (p.year_built) { yearSum += p.year_built; yearCount++ }
            if (p.exterior_condition_score) { conditionSum += p.exterior_condition_score; conditionCount++ }
            if (p.lead_score) { scoreSum += p.lead_score; scoreCount++ }
            if (p.estimated_ticket) { analysis.totalEstimatedRevenue += Number(p.estimated_ticket) }
            if (p.property_type) {
              analysis.propertyTypeBreakdown[p.property_type] = (analysis.propertyTypeBreakdown[p.property_type] || 0) + 1
            }
            if (p.urgency_level) {
              analysis.urgencyBreakdown[p.urgency_level]++
            }
          })

          analysis.avgHomeValue = valueCount ? Math.round(valueSum / valueCount) : 0
          analysis.avgYearBuilt = yearCount ? Math.round(yearSum / yearCount) : 0
          analysis.avgConditionScore = conditionCount ? Math.round(conditionSum / conditionCount) : 0
          analysis.avgLeadScore = scoreCount ? Math.round(scoreSum / scoreCount) : 0

          // Top opportunities
          const sorted = [...properties].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0)).slice(0, 5)
          analysis.topOpportunities = sorted.map(p => ({
            address: p.full_address,
            score: p.lead_score || 0,
            ticket: Number(p.estimated_ticket) || 0,
            recommendation: p.ai_service_recommendation || 'Needs analysis'
          }))

          // Generate insights
          if (analysis.avgYearBuilt < 1990) {
            analysis.insights.push(`Older neighborhood (avg built ${analysis.avgYearBuilt}) - high potential for renovation/repair services`)
          }
          if (analysis.avgConditionScore < 50) {
            analysis.insights.push(`Low avg condition score (${analysis.avgConditionScore}) - many properties need exterior work`)
          }
          if (analysis.avgHomeValue > 400000) {
            analysis.insights.push(`High-value market (avg $${analysis.avgHomeValue.toLocaleString()}) - customers can afford premium services`)
          }
          if (analysis.urgencyBreakdown.immediate + analysis.urgencyBreakdown.high > properties.length * 0.3) {
            analysis.insights.push(`${Math.round((analysis.urgencyBreakdown.immediate + analysis.urgencyBreakdown.high) / properties.length * 100)}% of properties have high urgency - strike while the iron is hot!`)
          }

          return analysis
        },
      }),

      suggestTargetAreas: tool({
        description: 'Analyze all property data to suggest the best areas/ZIP codes to focus outreach',
        parameters: z.object({
          topN: z.number().describe('Number of top areas to return'),
        }),
        execute: async ({ topN }) => {
          const { data: properties } = await supabase
            .from('property_leads')
            .select('zip_code, city, lead_score, estimated_ticket, outreach_status')
            .eq('user_id', user.id)

          if (!properties || properties.length === 0) {
            return { message: 'No property data to analyze. Import property leads first.' }
          }

          // Group by ZIP code
          const zipAnalysis: Record<string, {
            count: number,
            avgScore: number,
            totalTicket: number,
            notContacted: number,
            city: string
          }> = {}

          properties.forEach(p => {
            if (!p.zip_code) return
            if (!zipAnalysis[p.zip_code]) {
              zipAnalysis[p.zip_code] = { count: 0, avgScore: 0, totalTicket: 0, notContacted: 0, city: p.city || '' }
            }
            zipAnalysis[p.zip_code].count++
            zipAnalysis[p.zip_code].avgScore += p.lead_score || 0
            zipAnalysis[p.zip_code].totalTicket += Number(p.estimated_ticket) || 0
            if (p.outreach_status === 'not_contacted') zipAnalysis[p.zip_code].notContacted++
          })

          // Calculate averages and score
          const ranked = Object.entries(zipAnalysis).map(([zip, data]) => ({
            zipCode: zip,
            city: data.city,
            propertyCount: data.count,
            avgLeadScore: Math.round(data.avgScore / data.count),
            totalPotentialRevenue: data.totalTicket,
            untouchedLeads: data.notContacted,
            opportunityScore: Math.round(
              (data.avgScore / data.count) * 0.4 + 
              (data.notContacted / data.count * 100) * 0.3 +
              (data.totalTicket / 10000) * 0.3
            )
          })).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, topN)

          return {
            targetAreas: ranked,
            recommendation: ranked.length 
              ? `Focus your outreach on ${ranked[0].zipCode} (${ranked[0].city}) - ${ranked[0].untouchedLeads} untouched leads worth $${ranked[0].totalPotentialRevenue.toLocaleString()} in potential revenue!`
              : 'Need more property data to make recommendations'
          }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
