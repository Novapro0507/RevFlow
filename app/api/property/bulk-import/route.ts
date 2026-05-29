import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { enrichPropertyData } from '../enrich/route'

// Fetch properties from county records API (example: PropertyShark, DataTree, etc.)
async function fetchCountyRecords(
  county: string,
  state: string,
  filters: {
    minValue?: number
    maxValue?: number
    minYearBuilt?: number
    maxYearBuilt?: number
    propertyTypes?: string[]
    limit?: number
  }
): Promise<Array<{
  address: string
  city: string
  state: string
  zip: string
  ownerName?: string
  assessedValue?: number
  yearBuilt?: number
  propertyType?: string
  parcelId?: string
}>> {
  const apiKey = process.env.COUNTY_RECORDS_API_KEY
  
  // This is a placeholder - actual implementation depends on your county records provider
  // Options: DataTree, PropertyShark, CoreLogic, or direct county API
  if (!apiKey) {
    console.log('[CountyAPI] County records API key not configured')
    return []
  }

  try {
    // Example API call structure - adjust based on your provider
    const response = await fetch('https://api.countyrecords.example/v1/properties', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        county,
        state,
        filters: {
          assessedValueMin: filters.minValue,
          assessedValueMax: filters.maxValue,
          yearBuiltMin: filters.minYearBuilt,
          yearBuiltMax: filters.maxYearBuilt,
          propertyTypes: filters.propertyTypes,
        },
        limit: filters.limit || 100,
      }),
    })

    const data = await response.json()
    return data.properties || []
  } catch (error) {
    console.error('[CountyAPI] Error fetching county records:', error)
    return []
  }
}

// Fetch properties by ZIP code area using various data providers
async function fetchPropertiesByArea(
  zipCodes: string[],
  filters: {
    minValue?: number
    maxValue?: number
    minYearBuilt?: number
    maxYearBuilt?: number
    limit?: number
  }
): Promise<Array<{
  address: string
  city: string
  state: string
  zip: string
  ownerName?: string
  homeValue?: number
  yearBuilt?: number
  propertyType?: string
}>> {
  const apiKey = process.env.ATTOM_API_KEY || process.env.ESTATED_API_KEY
  
  if (!apiKey) {
    console.log('[AreaAPI] No property API key configured')
    return []
  }

  const properties: Array<{
    address: string
    city: string
    state: string
    zip: string
    ownerName?: string
    homeValue?: number
    yearBuilt?: number
    propertyType?: string
  }> = []

  // ATTOM Area Search
  if (process.env.ATTOM_API_KEY) {
    try {
      for (const zip of zipCodes) {
        const params = new URLSearchParams({
          postalcode: zip,
          minAvmValue: String(filters.minValue || 0),
          maxAvmValue: String(filters.maxValue || 10000000),
          pageSize: String(Math.min(filters.limit || 50, 100)),
        })

        const response = await fetch(
          `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?${params}`,
          {
            headers: {
              'apikey': process.env.ATTOM_API_KEY!,
              'Accept': 'application/json',
            },
          }
        )

        const data = await response.json()
        
        if (data.property) {
          for (const prop of data.property) {
            if (filters.minYearBuilt && prop.building?.summary?.yearBuilt < filters.minYearBuilt) continue
            if (filters.maxYearBuilt && prop.building?.summary?.yearBuilt > filters.maxYearBuilt) continue

            properties.push({
              address: prop.address?.oneLine || `${prop.address?.line1}`,
              city: prop.address?.locality,
              state: prop.address?.countrySubd,
              zip: prop.address?.postal1,
              ownerName: prop.assessment?.owner?.owner1?.fullName,
              homeValue: prop.assessment?.assessed?.assdTtlValue,
              yearBuilt: prop.building?.summary?.yearBuilt,
              propertyType: prop.summary?.propSubType,
            })
          }
        }
      }
    } catch (error) {
      console.error('[AreaAPI] ATTOM error:', error)
    }
  }

  return properties.slice(0, filters.limit || 100)
}

// Geocode an address using Google Maps
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const encoded = encodeURIComponent(address)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      }
    }
    return null
  } catch (error) {
    console.error('[Geocode] Error:', error)
    return null
  }
}

// POST - Bulk import properties from external sources
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      source, // 'county', 'area', 'addresses'
      county,
      state,
      zipCodes,
      addresses, // Array of addresses to lookup
      filters,
      enrichData, // Whether to enrich with additional APIs
    } = body

    let properties: Array<{
      address: string
      city: string
      state: string
      zip: string
      ownerName?: string
      homeValue?: number
      yearBuilt?: number
      propertyType?: string
    }> = []

    // Fetch properties based on source
    if (source === 'county' && county && state) {
      properties = await fetchCountyRecords(county, state, filters || {})
    } else if (source === 'area' && zipCodes?.length > 0) {
      properties = await fetchPropertiesByArea(zipCodes, filters || {})
    } else if (source === 'addresses' && addresses?.length > 0) {
      // Parse addresses and prepare for enrichment
      properties = addresses.map((addr: string) => {
        // Try to parse "123 Main St, City, ST 12345" format
        const parts = addr.split(',').map((p: string) => p.trim())
        const lastPart = parts[parts.length - 1] || ''
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/)
        
        return {
          address: parts[0] || addr,
          city: parts[1] || '',
          state: stateZipMatch?.[1] || state || '',
          zip: stateZipMatch?.[2] || '',
        }
      })
    }

    if (properties.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No properties found or invalid source configuration' 
      }, { status: 400 })
    }

    // Get business profile for scoring
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('services')
      .eq('user_id', user.id)
      .single()

    const services = profile?.services || []

    // Process and insert properties
    const results = {
      imported: 0,
      enriched: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const property of properties) {
      try {
        // Check if property already exists
        const { data: existing } = await supabase
          .from('property_leads')
          .select('id')
          .eq('user_id', user.id)
          .eq('full_address', property.address)
          .eq('zip_code', property.zip)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        let enrichedData = {}
        let leadScore = 50
        let estimatedTicket = 2500

        // Enrich if requested and we have APIs configured
        if (enrichData) {
          const enrichResult = await enrichPropertyData(
            '',
            property.address,
            property.city,
            property.state,
            property.zip,
            property.ownerName
          )
          if (enrichResult.success && enrichResult.data) {
            enrichedData = enrichResult.data
            results.enriched++

            // Calculate scores
            const currentYear = new Date().getFullYear()
            const yearBuilt = enrichResult.data.yearBuilt || property.yearBuilt
            const homeValue = enrichResult.data.homeValue || property.homeValue

            if (yearBuilt) {
              const age = currentYear - yearBuilt
              if (age > 30) leadScore += 20
              else if (age > 20) leadScore += 15
              else if (age > 10) leadScore += 10
            }

            if (homeValue) {
              if (homeValue > 500000) { leadScore += 15; estimatedTicket = 8000 }
              else if (homeValue > 300000) { leadScore += 10; estimatedTicket = 5000 }
              else if (homeValue > 150000) { leadScore += 5; estimatedTicket = 3500 }
            }
          }
        }

        // Geocode if we have Google Maps API
        let coords = null
        if (process.env.GOOGLE_MAPS_API_KEY) {
          coords = await geocodeAddress(`${property.address}, ${property.city}, ${property.state} ${property.zip}`)
        }

        // Insert the property
        const { error: insertError } = await supabase
          .from('property_leads')
          .insert({
            user_id: user.id,
            full_address: property.address,
            city: property.city,
            state: property.state,
            zip_code: property.zip,
            owner_name: (enrichedData as any).ownerName || property.ownerName,
            home_value: (enrichedData as any).homeValue || property.homeValue,
            year_built: (enrichedData as any).yearBuilt || property.yearBuilt,
            property_type: (enrichedData as any).propertyType || property.propertyType || 'single_family',
            square_footage: (enrichedData as any).squareFootage,
            lot_size: (enrichedData as any).lotSize,
            bedrooms: (enrichedData as any).bedrooms,
            bathrooms: (enrichedData as any).bathrooms,
            roof_type: (enrichedData as any).roofType,
            exterior_material: (enrichedData as any).exteriorMaterial,
            latitude: coords?.lat || (enrichedData as any).latitude,
            longitude: coords?.lng || (enrichedData as any).longitude,
            lead_score: Math.min(100, leadScore),
            estimated_ticket: estimatedTicket,
            outreach_status: 'not_contacted',
            data_sources: ['api_import'],
          })

        if (insertError) {
          results.errors.push(`${property.address}: ${insertError.message}`)
        } else {
          results.imported++
        }
      } catch (error) {
        results.errors.push(`${property.address}: ${String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('[BulkImport] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
