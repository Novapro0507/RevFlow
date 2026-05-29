import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { enrichPropertyData } from '../enrich/route'

// This runs as a Vercel Cron job
// Configure in vercel.json: { "crons": [{ "path": "/api/property/sync", "schedule": "0 6 * * *" }] }

export const maxDuration = 300 // 5 minutes max for cron jobs

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role for cron jobs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all properties that need data refresh (older than 30 days or missing key data)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: properties, error: fetchError } = await supabase
      .from('property_leads')
      .select('id, user_id, full_address, city, state, zip_code, owner_name, updated_at, home_value, year_built')
      .or(`updated_at.lt.${thirtyDaysAgo.toISOString()},home_value.is.null,year_built.is.null`)
      .limit(100) // Process 100 at a time to stay within limits

    if (fetchError) {
      console.error('[Sync] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No properties need syncing',
        processed: 0 
      })
    }

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
    }

    for (const property of properties) {
      try {
        const result = await enrichPropertyData(
          property.id,
          property.full_address,
          property.city || '',
          property.state || '',
          property.zip_code || '',
          property.owner_name
        )

        if (result.success && result.data) {
          // Get user's services for scoring
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('services')
            .eq('user_id', property.user_id)
            .single()

          const services = profile?.services || []

          // Calculate scores
          let leadScore = 50
          let estimatedTicket = 2500
          const currentYear = new Date().getFullYear()

          if (result.data.yearBuilt) {
            const age = currentYear - result.data.yearBuilt
            if (age > 30) leadScore += 20
            else if (age > 20) leadScore += 15
            else if (age > 10) leadScore += 10
          }

          if (result.data.homeValue) {
            if (result.data.homeValue > 500000) { leadScore += 15; estimatedTicket = 8000 }
            else if (result.data.homeValue > 300000) { leadScore += 10; estimatedTicket = 5000 }
            else if (result.data.homeValue > 150000) { leadScore += 5; estimatedTicket = 3500 }
          }

          // Update the property
          const { error: updateError } = await supabase
            .from('property_leads')
            .update({
              home_value: result.data.homeValue || property.home_value,
              assessed_value: result.data.assessedValue,
              year_built: result.data.yearBuilt || property.year_built,
              last_sale_date: result.data.lastSaleDate,
              last_sale_price: result.data.lastSalePrice,
              property_type: result.data.propertyType,
              square_footage: result.data.squareFootage,
              lot_size: result.data.lotSize,
              bedrooms: result.data.bedrooms,
              bathrooms: result.data.bathrooms,
              roof_type: result.data.roofType,
              exterior_material: result.data.exteriorMaterial,
              owner_name: result.data.ownerName || property.owner_name,
              latitude: result.data.latitude,
              longitude: result.data.longitude,
              lead_score: Math.min(100, leadScore),
              estimated_ticket: estimatedTicket,
              updated_at: new Date().toISOString(),
            })
            .eq('id', property.id)

          if (!updateError) {
            results.updated++
          }
        }

        results.processed++
      } catch (error) {
        console.error(`[Sync] Error processing ${property.id}:`, error)
        results.errors++
      }

      // Rate limiting - wait 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('[Sync] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Manual sync trigger for specific properties
export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { propertyIds, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get properties to sync
    let query = supabase
      .from('property_leads')
      .select('id, user_id, full_address, city, state, zip_code, owner_name, home_value, year_built')
      .eq('user_id', userId)

    if (propertyIds?.length > 0) {
      query = query.in('id', propertyIds)
    } else {
      query = query.limit(50) // Default limit
    }

    const { data: properties, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
    }

    for (const property of properties || []) {
      try {
        const result = await enrichPropertyData(
          property.id,
          property.full_address,
          property.city || '',
          property.state || '',
          property.zip_code || '',
          property.owner_name
        )

        if (result.success && result.data) {
          let leadScore = 50
          let estimatedTicket = 2500
          const currentYear = new Date().getFullYear()

          if (result.data.yearBuilt) {
            const age = currentYear - result.data.yearBuilt
            if (age > 30) leadScore += 20
            else if (age > 20) leadScore += 15
            else if (age > 10) leadScore += 10
          }

          if (result.data.homeValue) {
            if (result.data.homeValue > 500000) { leadScore += 15; estimatedTicket = 8000 }
            else if (result.data.homeValue > 300000) { leadScore += 10; estimatedTicket = 5000 }
            else if (result.data.homeValue > 150000) { leadScore += 5; estimatedTicket = 3500 }
          }

          await supabase
            .from('property_leads')
            .update({
              home_value: result.data.homeValue || property.home_value,
              assessed_value: result.data.assessedValue,
              year_built: result.data.yearBuilt || property.year_built,
              last_sale_date: result.data.lastSaleDate,
              last_sale_price: result.data.lastSalePrice,
              property_type: result.data.propertyType,
              square_footage: result.data.squareFootage,
              lot_size: result.data.lotSize,
              bedrooms: result.data.bedrooms,
              bathrooms: result.data.bathrooms,
              roof_type: result.data.roofType,
              exterior_material: result.data.exteriorMaterial,
              owner_name: result.data.ownerName || property.owner_name,
              latitude: result.data.latitude,
              longitude: result.data.longitude,
              lead_score: Math.min(100, leadScore),
              estimated_ticket: estimatedTicket,
              updated_at: new Date().toISOString(),
            })
            .eq('id', property.id)

          results.updated++
        }

        results.processed++
      } catch (error) {
        results.errors++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('[ManualSync] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
