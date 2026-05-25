import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// SerpAPI integration for Google search intent monitoring
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { keyword, location } = body
  
  if (!keyword || !location) {
    return NextResponse.json(
      { error: "Keyword and location are required" }, 
      { status: 400 }
    )
  }
  
  const serpApiKey = process.env.SERPAPI_API_KEY
  
  if (!serpApiKey) {
    // Return mock data for demo purposes
    return NextResponse.json({
      results: generateMockSearchResults(keyword, location),
      message: "Demo mode: Add SERPAPI_API_KEY for real data"
    })
  }
  
  try {
    const params = new URLSearchParams({
      api_key: serpApiKey,
      q: keyword,
      location: location,
      google_domain: "google.com",
      gl: "us",
      hl: "en",
    })
    
    const response = await fetch(`https://serpapi.com/search.json?${params}`)
    const data = await response.json()
    
    // Extract relevant results
    const localResults = data.local_results || []
    const organicResults = data.organic_results || []
    
    const results = [
      ...localResults.map((r: any) => ({
        type: "local",
        title: r.title,
        address: r.address,
        phone: r.phone,
        rating: r.rating,
        reviews: r.reviews,
        place_id: r.place_id,
        intent_score: calculateIntentScore(r, keyword),
      })),
      ...organicResults.slice(0, 10).map((r: any) => ({
        type: "organic",
        title: r.title,
        snippet: r.snippet,
        url: r.link,
        position: r.position,
        intent_score: calculateIntentScore(r, keyword),
      })),
    ]
    
    return NextResponse.json({ results, relatedSearches: data.related_searches })
  } catch (error) {
    console.error("SerpAPI error:", error)
    return NextResponse.json(
      { error: "Failed to fetch search results" }, 
      { status: 500 }
    )
  }
}

function calculateIntentScore(result: any, keyword: string): number {
  let score = 50
  
  // Higher score for local business results
  if (result.phone) score += 15
  if (result.address) score += 10
  if (result.rating && result.rating >= 4) score += 10
  if (result.reviews && result.reviews > 10) score += 5
  
  // Check if title/snippet contains high-intent keywords
  const highIntentKeywords = ["hire", "need", "looking for", "best", "top", "services", "near me"]
  const text = (result.title + " " + (result.snippet || "")).toLowerCase()
  
  highIntentKeywords.forEach(kw => {
    if (text.includes(kw)) score += 5
  })
  
  return Math.min(score, 100)
}

function generateMockSearchResults(keyword: string, location: string) {
  return [
    {
      type: "local",
      title: `${keyword} Services - Premium Solutions`,
      address: `123 Main St, ${location}`,
      phone: "(555) 123-4567",
      rating: 4.8,
      reviews: 127,
      intent_score: 85,
    },
    {
      type: "local",
      title: `Best ${keyword} in ${location}`,
      address: `456 Oak Ave, ${location}`,
      phone: "(555) 234-5678",
      rating: 4.5,
      reviews: 89,
      intent_score: 78,
    },
    {
      type: "organic",
      title: `Top 10 ${keyword} Companies in ${location} - 2024 Reviews`,
      snippet: `Looking for the best ${keyword} services? Our comprehensive guide covers the top providers in ${location}...`,
      url: "https://example.com/best-services",
      position: 1,
      intent_score: 72,
    },
    {
      type: "organic",
      title: `How to Find Quality ${keyword} Near You`,
      snippet: `Expert tips for hiring ${keyword} professionals in your area. Compare prices, read reviews...`,
      url: "https://example.com/hiring-guide",
      position: 2,
      intent_score: 65,
    },
  ]
}
