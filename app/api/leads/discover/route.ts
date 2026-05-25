import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Apollo.io integration for B2B lead discovery
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { 
    locations, 
    titles, 
    industries, 
    companySizes,
    keywords 
  } = body
  
  const apolloApiKey = process.env.APOLLO_API_KEY
  
  if (!apolloApiKey) {
    // Return mock data for demo purposes
    return NextResponse.json({
      leads: generateMockApolloLeads(locations, titles, industries),
      message: "Demo mode: Add APOLLO_API_KEY for real data"
    })
  }
  
  try {
    const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apolloApiKey,
      },
      body: JSON.stringify({
        person_locations: locations,
        person_titles: titles,
        organization_industry_tag_ids: industries,
        organization_num_employees_ranges: companySizes,
        q_keywords: keywords,
        per_page: 25,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || "Apollo API error")
    }
    
    const leads = data.people?.map((person: any) => ({
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      phone: person.phone_numbers?.[0]?.sanitized_number,
      company: person.organization?.name,
      job_title: person.title,
      industry: person.organization?.industry,
      location: `${person.city}, ${person.state}, ${person.country}`,
      website: person.organization?.website_url,
      linkedin_url: person.linkedin_url,
      lead_type: "b2b",
      source: "apollo",
      enrichment_data: {
        company_size: person.organization?.estimated_num_employees,
        company_revenue: person.organization?.annual_revenue,
        technologies: person.organization?.technologies,
        funding: person.organization?.total_funding,
      },
    })) || []
    
    return NextResponse.json({ leads })
  } catch (error) {
    console.error("Apollo API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads from Apollo" }, 
      { status: 500 }
    )
  }
}

function generateMockApolloLeads(
  locations: string[], 
  titles: string[], 
  industries: string[]
) {
  const mockCompanies = [
    "TechCorp Solutions", "InnovateTech", "DataDrive Inc", 
    "CloudScale Systems", "NextGen Software", "Quantum Dynamics"
  ]
  
  const mockTitles = titles?.length > 0 ? titles : [
    "CEO", "CTO", "VP of Engineering", "Director of Operations",
    "Head of Growth", "Chief Revenue Officer"
  ]
  
  return Array.from({ length: 10 }, (_, i) => ({
    first_name: ["John", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Lisa", "William", "Amanda"][i],
    last_name: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"][i],
    email: `contact${i + 1}@${mockCompanies[i % mockCompanies.length].toLowerCase().replace(/\s/g, "")}.com`,
    phone: `(555) ${100 + i}-${1000 + i * 111}`,
    company: mockCompanies[i % mockCompanies.length],
    job_title: mockTitles[i % mockTitles.length],
    industry: industries?.[0] || "Technology",
    location: locations?.[0] || "Austin, TX",
    website: `https://${mockCompanies[i % mockCompanies.length].toLowerCase().replace(/\s/g, "")}.com`,
    linkedin_url: `https://linkedin.com/in/${["john", "sarah", "michael", "emily", "david", "jennifer", "robert", "lisa", "william", "amanda"][i]}-${["smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis", "rodriguez", "martinez"][i]}`,
    lead_type: "b2b",
    source: "apollo",
    lead_score: 60 + Math.floor(Math.random() * 35),
    enrichment_data: {
      company_size: ["10-50", "50-200", "200-500", "500-1000"][Math.floor(Math.random() * 4)],
      funding: ["$1M", "$5M", "$10M", "$25M", "$50M"][Math.floor(Math.random() * 5)],
    },
  }))
}
