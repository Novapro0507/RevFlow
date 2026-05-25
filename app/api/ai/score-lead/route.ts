import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// AI-powered lead scoring
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { leadId } = body
  
  // Fetch the lead data
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single()
  
  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  
  // Calculate AI score based on multiple factors
  const score = calculateLeadScore(lead)
  const factors = getScoreFactors(lead, score)
  
  // Update lead score in database
  await supabase
    .from("leads")
    .update({ lead_score: score.total })
    .eq("id", leadId)
  
  // Store AI prediction
  await supabase.from("ai_predictions").insert({
    user_id: user.id,
    lead_id: leadId,
    prediction_type: "lead_score",
    prediction_value: score.total,
    confidence: score.confidence,
    reasoning: score.reasoning,
    factors: factors,
  })
  
  return NextResponse.json({ 
    score: score.total, 
    confidence: score.confidence,
    reasoning: score.reasoning,
    factors 
  })
}

function calculateLeadScore(lead: any): { 
  total: number; 
  confidence: number; 
  reasoning: string 
} {
  let score = 0
  let maxScore = 100
  const factors: string[] = []
  
  // Contact completeness (20 points)
  if (lead.email) { score += 8; factors.push("Has email") }
  if (lead.phone) { score += 7; factors.push("Has phone") }
  if (lead.linkedin_url) { score += 5; factors.push("Has LinkedIn") }
  
  // Company information (25 points)
  if (lead.company) { score += 10; factors.push("Company identified") }
  if (lead.job_title) { score += 8; factors.push("Job title known") }
  if (lead.industry) { score += 7; factors.push("Industry identified") }
  
  // Intent signals (35 points)
  if (lead.intent_strength > 70) { 
    score += 20; factors.push("High intent signals") 
  } else if (lead.intent_strength > 40) { 
    score += 12; factors.push("Medium intent signals") 
  } else if (lead.intent_strength > 0) {
    score += 5; factors.push("Some intent detected")
  }
  
  if (lead.google_rating && lead.google_rating >= 4) {
    score += 8; factors.push("High Google rating")
  }
  
  if (lead.search_keywords) {
    score += 7; factors.push("Active searcher")
  }
  
  // Engagement (20 points)
  const enrichmentData = lead.enrichment_data || {}
  if (enrichmentData.company_size) {
    const size = enrichmentData.company_size
    if (size.includes("500") || size.includes("1000")) {
      score += 12; factors.push("Enterprise company")
    } else if (size.includes("200") || size.includes("50")) {
      score += 8; factors.push("Mid-market company")
    } else {
      score += 4; factors.push("SMB company")
    }
  }
  
  if (enrichmentData.funding) {
    score += 8; factors.push("Funded company")
  }
  
  // Calculate confidence based on data completeness
  const dataFields = [
    lead.email, lead.phone, lead.company, lead.job_title, 
    lead.industry, lead.location, lead.linkedin_url
  ]
  const filledFields = dataFields.filter(Boolean).length
  const confidence = (filledFields / dataFields.length) * 100
  
  // Generate reasoning
  const topFactors = factors.slice(0, 3).join(", ")
  const reasoning = score >= 75 
    ? `High-quality lead with strong signals: ${topFactors}.`
    : score >= 50
    ? `Promising lead worth pursuing: ${topFactors}.`
    : score >= 25
    ? `Early-stage lead, needs nurturing: ${topFactors}.`
    : `Incomplete data, consider enrichment.`
  
  return {
    total: Math.min(score, maxScore),
    confidence: Math.round(confidence),
    reasoning,
  }
}

function getScoreFactors(lead: any, score: { total: number }) {
  return [
    {
      category: "Contact Info",
      score: (lead.email ? 8 : 0) + (lead.phone ? 7 : 0) + (lead.linkedin_url ? 5 : 0),
      maxScore: 20,
      details: [
        lead.email && "Email verified",
        lead.phone && "Phone available",
        lead.linkedin_url && "LinkedIn profile",
      ].filter(Boolean),
    },
    {
      category: "Company Data",
      score: (lead.company ? 10 : 0) + (lead.job_title ? 8 : 0) + (lead.industry ? 7 : 0),
      maxScore: 25,
      details: [
        lead.company && `Works at ${lead.company}`,
        lead.job_title && `Title: ${lead.job_title}`,
        lead.industry && `Industry: ${lead.industry}`,
      ].filter(Boolean),
    },
    {
      category: "Intent Signals",
      score: Math.min(lead.intent_strength || 0, 35),
      maxScore: 35,
      details: [
        lead.search_keywords && `Searched: "${lead.search_keywords}"`,
        lead.google_rating && `Rating: ${lead.google_rating}/5`,
        lead.last_search_detected_at && "Recent search activity",
      ].filter(Boolean),
    },
  ]
}
