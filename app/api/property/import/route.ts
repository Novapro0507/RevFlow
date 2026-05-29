import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = 'realty-mole-property-api.p.rapidapi.com'

interface PropertyData {
  addressLine1: string
  city: string
  state: string
  zipCode: string
  county: string
  latitude: number
  longitude: number
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFootage: number
  lotSize: number
  yearBuilt: number
  lastSaleDate: string
  lastSalePrice: number
  owner: string
  ownerOccupied: boolean
  estimatedValue: number
  assessedValue: number
}

// Fetch property data from RealtyMole
async function fetchPropertyByAddress(address: string): Promise<PropertyData | null> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY not configured')
  }

  const encodedAddress = encodeURIComponent(address)
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/properties?address=${encodedAddress}`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  )

  if (!response.ok) {
    console.error('[v0] RealtyMole API error:', response.status, await response.text())
    return null
  }

  const data = await response.json()
  return data
}

// Fetch properties by ZIP code
async function fetchPropertiesByZip(zipCode: string, limit: number = 50): Promise<PropertyData[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY not configured')
  }

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/zipCodes/${zipCode}/properties?limit=${limit}`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  )

  if (!response.ok) {
    console.error('[v0] RealtyMole API error:', response.status, await response.text())
    return []
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

// Calculate lead score based on property characteristics
function calculateLeadScore(property: PropertyData, services: string[]): number {
  let score = 50 // Base score

  // Older homes need more work
  const age = new Date().getFullYear() - (property.yearBuilt || 2000)
  if (age > 30) score += 20
  else if (age > 20) score += 15
  else if (age > 10) score += 10

  // Higher value homes = bigger tickets
  const value = property.estimatedValue || 0
  if (value > 500000) score += 15
  else if (value > 300000) score += 10
  else if (value > 150000) score += 5

  // Owner-occupied more likely to invest
  if (property.ownerOccupied) score += 10

  // Larger homes need more maintenance
  const sqft = property.squareFootage || 0
  if (sqft > 3000) score += 10
  else if (sqft > 2000) score += 5

  return Math.min(100, Math.max(0, score))
}

// Estimate ticket value based on services and property
function estimateTicket(property: PropertyData, services: string[]): number {
  const sqft = property.squareFootage || 2000
  const value = property.estimatedValue || 300000
  
  // Base estimate on property value and size
  let estimate = 0
  
  // Rough estimates based on common home services
  if (services.some(s => s.toLowerCase().includes('roof'))) {
    estimate += sqft * 4 // ~$4/sqft for roofing
  }
  if (services.some(s => s.toLowerCase().includes('paint') || s.toLowerCase().includes('exterior'))) {
    estimate += sqft * 2 // ~$2/sqft for exterior painting
  }
  if (services.some(s => s.toLowerCase().includes('window'))) {
    estimate += 500 * Math.ceil(sqft / 500) // ~$500 per window estimate
  }
  if (services.some(s => s.toLowerCase().includes('hvac') || s.toLowerCase().includes('heating') || s.toLowerCase().includes('cooling'))) {
    estimate += 5000 + (sqft > 2000 ? 3000 : 0)
  }
  if (services.some(s => s.toLowerCase().includes('solar'))) {
    estimate += value * 0.03 // ~3% of home value
  }
  if (services.some(s => s.toLowerCase().includes('landscape') || s.toLowerCase().includes('lawn'))) {
    estimate += 2000 + (property.lotSize || 0) * 0.5
  }
  
  // Default estimate if no specific service match
  if (estimate === 0) {
    estimate = value * 0.02 // 2% of home value as baseline
  }
  
  return Math.round(estimate)
}

// POST - Import properties by ZIP code or address
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, zipCode, address, limit = 50 } = body

    // Get business profile for service-based scoring
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('services')
      .eq('user_id', user.id)
      .single()
    
    const services = profile?.services || []

    let properties: PropertyData[] = []

    if (type === 'zip' && zipCode) {
      properties = await fetchPropertiesByZip(zipCode, limit)
    } else if (type === 'address' && address) {
      const property = await fetchPropertyByAddress(address)
      if (property) properties = [property]
    } else {
      return NextResponse.json({ error: 'Invalid request. Provide type and zipCode or address.' }, { status: 400 })
    }

    if (properties.length === 0) {
      return NextResponse.json({ error: 'No properties found' }, { status: 404 })
    }

    // Transform and insert properties
    const propertyLeads = properties.map(p => ({
      user_id: user.id,
      full_address: p.addressLine1 || '',
      city: p.city || '',
      state: p.state || '',
      zip_code: p.zipCode || zipCode || '',
      latitude: p.latitude,
      longitude: p.longitude,
      owner_name: p.owner || null,
      owner_type: p.ownerOccupied ? 'individual' : 'unknown',
      home_value: p.estimatedValue || null,
      assessed_value: p.assessedValue || null,
      year_built: p.yearBuilt || null,
      last_sale_date: p.lastSaleDate || null,
      last_sale_price: p.lastSalePrice || null,
      property_type: mapPropertyType(p.propertyType),
      square_footage: p.squareFootage || null,
      lot_size: p.lotSize || null,
      bedrooms: p.bedrooms || null,
      bathrooms: p.bathrooms || null,
      lead_score: calculateLeadScore(p, services),
      estimated_ticket: estimateTicket(p, services),
      data_sources: ['realtymole'],
      outreach_status: 'not_contacted',
    }))

    // Upsert to avoid duplicates
    const { data: inserted, error } = await supabase
      .from('property_leads')
      .upsert(propertyLeads, {
        onConflict: 'user_id,full_address',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('[v0] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: properties.length,
      message: `Imported ${properties.length} properties from ${type === 'zip' ? `ZIP ${zipCode}` : address}`,
    })

  } catch (error) {
    console.error('[v0] Property import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to import properties' 
    }, { status: 500 })
  }
}

// GET - Enrich a single property by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('id')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Get the property
    const { data: property, error: fetchError } = await supabase
      .from('property_leads')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch fresh data from RealtyMole
    const fullAddress = `${property.full_address}, ${property.city}, ${property.state} ${property.zip_code}`
    const freshData = await fetchPropertyByAddress(fullAddress)

    if (!freshData) {
      return NextResponse.json({ error: 'Could not enrich property data' }, { status: 404 })
    }

    // Get business profile for scoring
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('services')
      .eq('user_id', user.id)
      .single()
    
    const services = profile?.services || []

    // Update the property with fresh data
    const { data: updated, error: updateError } = await supabase
      .from('property_leads')
      .update({
        owner_name: freshData.owner || property.owner_name,
        home_value: freshData.estimatedValue || property.home_value,
        assessed_value: freshData.assessedValue || property.assessed_value,
        year_built: freshData.yearBuilt || property.year_built,
        last_sale_date: freshData.lastSaleDate || property.last_sale_date,
        last_sale_price: freshData.lastSalePrice || property.last_sale_price,
        square_footage: freshData.squareFootage || property.square_footage,
        lot_size: freshData.lotSize || property.lot_size,
        bedrooms: freshData.bedrooms || property.bedrooms,
        bathrooms: freshData.bathrooms || property.bathrooms,
        latitude: freshData.latitude || property.latitude,
        longitude: freshData.longitude || property.longitude,
        lead_score: calculateLeadScore(freshData, services),
        estimated_ticket: estimateTicket(freshData, services),
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, property: updated })

  } catch (error) {
    console.error('[v0] Property enrich error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to enrich property' 
    }, { status: 500 })
  }
}

function mapPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    'Single Family': 'single_family',
    'SingleFamily': 'single_family',
    'Multi Family': 'multi_family',
    'MultiFamily': 'multi_family',
    'Condo': 'condo',
    'Condominium': 'condo',
    'Townhouse': 'townhouse',
    'Commercial': 'commercial',
    'Land': 'land',
  }
  return typeMap[type] || 'other'
}
