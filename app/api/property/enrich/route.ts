import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Property Data Provider Interface
interface PropertyData {
  address: string
  city: string
  state: string
  zipCode: string
  ownerName?: string
  homeValue?: number
  assessedValue?: number
  yearBuilt?: number
  lastSaleDate?: string
  lastSalePrice?: number
  propertyType?: string
  squareFootage?: number
  lotSize?: number
  bedrooms?: number
  bathrooms?: number
  roofType?: string
  exteriorMaterial?: string
  latitude?: number
  longitude?: number
}

// Estated API - Property Data
async function fetchEstatedData(address: string, city: string, state: string, zip: string): Promise<Partial<PropertyData> | null> {
  const apiKey = process.env.ESTATED_API_KEY
  if (!apiKey) {
    console.log('[PropertyAPI] Estated API key not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      token: apiKey,
      street_address: address,
      city: city,
      state: state,
      zip_code: zip,
    })

    const response = await fetch(`https://apis.estated.com/v4/property?${params}`)
    const data = await response.json()

    if (data.data) {
      const property = data.data
      return {
        homeValue: property.valuation?.value,
        assessedValue: property.taxes?.assessment_value,
        yearBuilt: property.structure?.year_built,
        squareFootage: property.structure?.total_area_sq_ft,
        lotSize: property.parcel?.area_sq_ft ? property.parcel.area_sq_ft / 43560 : undefined, // Convert to acres
        bedrooms: property.structure?.beds_count,
        bathrooms: property.structure?.baths,
        propertyType: mapPropertyType(property.structure?.type),
        roofType: property.structure?.roof_material,
        exteriorMaterial: property.structure?.exterior_wall,
        ownerName: property.owner?.name,
        latitude: property.parcel?.centroid_lat,
        longitude: property.parcel?.centroid_lng,
      }
    }
    return null
  } catch (error) {
    console.error('[PropertyAPI] Estated error:', error)
    return null
  }
}

// RealtyMole API - Property Data (Alternative)
async function fetchRealtyMoleData(address: string, city: string, state: string, zip: string): Promise<Partial<PropertyData> | null> {
  const apiKey = process.env.REALTYMOLE_API_KEY
  if (!apiKey) {
    console.log('[PropertyAPI] RealtyMole API key not configured')
    return null
  }

  try {
    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
    const response = await fetch(`https://realty-mole-property-api.p.rapidapi.com/properties?address=${fullAddress}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com',
      },
    })
    const data = await response.json()

    if (data && data.length > 0) {
      const property = data[0]
      return {
        homeValue: property.estimatedValue,
        yearBuilt: property.yearBuilt,
        squareFootage: property.squareFootage,
        lotSize: property.lotSize,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        propertyType: mapPropertyType(property.propertyType),
        lastSaleDate: property.lastSaleDate,
        lastSalePrice: property.lastSalePrice,
        ownerName: property.ownerName,
        latitude: property.latitude,
        longitude: property.longitude,
      }
    }
    return null
  } catch (error) {
    console.error('[PropertyAPI] RealtyMole error:', error)
    return null
  }
}

// BatchData API - Skip Tracing (Phone/Email)
async function fetchSkipTraceData(name: string, address: string, city: string, state: string, zip: string): Promise<{ email?: string; phone?: string } | null> {
  const apiKey = process.env.BATCHDATA_API_KEY
  if (!apiKey) {
    console.log('[PropertyAPI] BatchData API key not configured')
    return null
  }

  try {
    const response = await fetch('https://api.batchdata.com/api/v1/skip-trace', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          name: name,
          address: {
            street: address,
            city: city,
            state: state,
            zip: zip,
          },
        }],
      }),
    })
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        email: result.emails?.[0]?.email,
        phone: result.phones?.[0]?.phone,
      }
    }
    return null
  } catch (error) {
    console.error('[PropertyAPI] BatchData error:', error)
    return null
  }
}

// ATTOM Data API - Comprehensive Property Data
async function fetchAttomData(address: string, city: string, state: string, zip: string): Promise<Partial<PropertyData> | null> {
  const apiKey = process.env.ATTOM_API_KEY
  if (!apiKey) {
    console.log('[PropertyAPI] ATTOM API key not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      address1: address,
      address2: `${city}, ${state} ${zip}`,
    })

    const response = await fetch(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?${params}`, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
      },
    })
    const data = await response.json()

    if (data.property && data.property.length > 0) {
      const property = data.property[0]
      return {
        homeValue: property.assessment?.assessed?.assdTtlValue,
        assessedValue: property.assessment?.market?.mktTtlValue,
        yearBuilt: property.building?.summary?.yearBuilt,
        squareFootage: property.building?.size?.universalSize,
        lotSize: property.lot?.lotSize1,
        bedrooms: property.building?.rooms?.beds,
        bathrooms: property.building?.rooms?.bathsTotal,
        propertyType: mapPropertyType(property.summary?.propSubType),
        ownerName: property.assessment?.owner?.owner1?.fullName,
        lastSaleDate: property.sale?.saleTransDate,
        lastSalePrice: property.sale?.saleAmt,
      }
    }
    return null
  } catch (error) {
    console.error('[PropertyAPI] ATTOM error:', error)
    return null
  }
}

// Helper to map property types
function mapPropertyType(type: string | undefined): string {
  if (!type) return 'single_family'
  const lower = type.toLowerCase()
  if (lower.includes('single') || lower.includes('sfr')) return 'single_family'
  if (lower.includes('multi') || lower.includes('duplex') || lower.includes('triplex')) return 'multi_family'
  if (lower.includes('condo')) return 'condo'
  if (lower.includes('town')) return 'townhouse'
  if (lower.includes('commercial') || lower.includes('office')) return 'commercial'
  if (lower.includes('land') || lower.includes('vacant')) return 'land'
  return 'other'
}

// Calculate lead score based on property data
function calculateLeadScore(data: Partial<PropertyData>, services: string[]): number {
  let score = 50 // Base score

  // Age bonus (older homes need more work)
  const currentYear = new Date().getFullYear()
  if (data.yearBuilt) {
    const age = currentYear - data.yearBuilt
    if (age > 30) score += 20
    else if (age > 20) score += 15
    else if (age > 10) score += 10
  }

  // Value bonus (higher value = bigger tickets)
  if (data.homeValue) {
    if (data.homeValue > 500000) score += 15
    else if (data.homeValue > 300000) score += 10
    else if (data.homeValue > 150000) score += 5
  }

  // Square footage bonus
  if (data.squareFootage) {
    if (data.squareFootage > 3000) score += 10
    else if (data.squareFootage > 2000) score += 5
  }

  // Owner type bonus (individual owners more likely to convert)
  if (data.ownerName && !data.ownerName.toLowerCase().includes('llc') && 
      !data.ownerName.toLowerCase().includes('corp') &&
      !data.ownerName.toLowerCase().includes('trust')) {
    score += 5
  }

  return Math.min(100, Math.max(0, score))
}

// Calculate estimated ticket based on services and property
function calculateEstimatedTicket(data: Partial<PropertyData>, services: string[]): number {
  let baseTicket = 2500 // Default base

  // Adjust based on home value
  if (data.homeValue) {
    if (data.homeValue > 500000) baseTicket = 8000
    else if (data.homeValue > 300000) baseTicket = 5000
    else if (data.homeValue > 200000) baseTicket = 3500
  }

  // Adjust based on square footage
  if (data.squareFootage) {
    baseTicket += Math.floor(data.squareFootage / 500) * 200
  }

  return baseTicket
}

// Main enrichment function
export async function enrichPropertyData(
  propertyId: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  ownerName?: string
): Promise<{ success: boolean; data?: Partial<PropertyData>; error?: string }> {
  try {
    // Try multiple providers in order of preference
    let propertyData: Partial<PropertyData> = {}

    // 1. Try Estated first (best balance of cost/data)
    const estatedData = await fetchEstatedData(address, city, state, zip)
    if (estatedData) {
      propertyData = { ...propertyData, ...estatedData }
    }

    // 2. If missing key data, try RealtyMole
    if (!propertyData.homeValue || !propertyData.yearBuilt) {
      const realtyMoleData = await fetchRealtyMoleData(address, city, state, zip)
      if (realtyMoleData) {
        propertyData = { ...propertyData, ...realtyMoleData }
      }
    }

    // 3. Try ATTOM for comprehensive data
    if (!propertyData.ownerName) {
      const attomData = await fetchAttomData(address, city, state, zip)
      if (attomData) {
        propertyData = { ...propertyData, ...attomData }
      }
    }

    // 4. Skip trace for contact info if we have owner name
    const nameToTrace = propertyData.ownerName || ownerName
    if (nameToTrace) {
      const skipTraceData = await fetchSkipTraceData(nameToTrace, address, city, state, zip)
      if (skipTraceData) {
        propertyData = { ...propertyData, ...skipTraceData } as Partial<PropertyData>
      }
    }

    return { success: true, data: propertyData }
  } catch (error) {
    console.error('[PropertyAPI] Enrichment error:', error)
    return { success: false, error: String(error) }
  }
}

// POST endpoint for enriching a single property
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { propertyId, address, city, state, zip, ownerName } = body

    if (!address || !city || !zip) {
      return NextResponse.json({ error: 'Address, city, and zip are required' }, { status: 400 })
    }

    // Get business profile for services
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('services')
      .eq('user_id', user.id)
      .single()

    const services = profile?.services || []

    // Enrich the property data
    const result = await enrichPropertyData(propertyId, address, city, state || '', zip, ownerName)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const data = result.data || {}

    // Calculate scores
    const leadScore = calculateLeadScore(data, services)
    const estimatedTicket = calculateEstimatedTicket(data, services)

    // Update or insert the property
    if (propertyId) {
      const { error: updateError } = await supabase
        .from('property_leads')
        .update({
          home_value: data.homeValue,
          assessed_value: data.assessedValue,
          year_built: data.yearBuilt,
          last_sale_date: data.lastSaleDate,
          last_sale_price: data.lastSalePrice,
          property_type: data.propertyType,
          square_footage: data.squareFootage,
          lot_size: data.lotSize,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          roof_type: data.roofType,
          exterior_material: data.exteriorMaterial,
          owner_name: data.ownerName || ownerName,
          latitude: data.latitude,
          longitude: data.longitude,
          lead_score: leadScore,
          estimated_ticket: estimatedTicket,
          data_sources: ['estated', 'realtymole', 'attom', 'batchdata'].filter(s => data[s as keyof typeof data]),
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        leadScore,
        estimatedTicket,
      },
    })
  } catch (error) {
    console.error('[PropertyAPI] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
