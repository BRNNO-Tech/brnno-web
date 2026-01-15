import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')

    console.log('[addons API] Request received for businessId:', businessId, 'serviceId:', serviceId)

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Only show add-ons that were created for the specific service (have service_id matching)
    // This excludes general business add-ons created via seed scripts or other means
    if (!serviceId) {
      // If no serviceId provided, return empty array (shouldn't happen in booking flow)
      return NextResponse.json({ addons: [] })
    }

    // Query for add-ons: prefer service-specific, but also include business-wide add-ons if no service-specific ones exist
    // First, try to get service-specific add-ons
    let query = supabase
      .from('service_addons')
      .select('*')
      .eq('business_id', businessId)
      .eq('service_id', serviceId) // Only add-ons created for this specific service
      .eq('is_active', true)
      .order('sort_order', { nullsFirst: false, ascending: true })
      .order('name', { ascending: true }) // Secondary sort by name

    const { data: addons, error } = await query

    console.log('[addons API] Query result:', { 
      addonsCount: addons?.length || 0, 
      error: error?.message,
      errorCode: error?.code,
      businessId,
      serviceId
    })

    if (error) {
      console.error('[addons API] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    // Deduplicate add-ons by ID (in case of any duplicates)
    const uniqueAddons = (addons || []).filter((addon, index, self) =>
      index === self.findIndex((a) => a.id === addon.id)
    )

    const result = { addons: uniqueAddons }
    console.log('[addons API] Returning:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[addons API] Error fetching add-ons:', error)
    const errorMessage = error?.message || 'Unknown error occurred'
    const errorDetails = error?.details || error?.hint || null
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch add-ons', 
        details: errorMessage,
        ...(errorDetails && { hint: errorDetails })
      },
      { status: 500 }
    )
  }
}
