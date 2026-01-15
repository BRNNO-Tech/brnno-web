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

    // Query for service-specific add-ons
    // Build query step by step
    let query = supabase
      .from('service_addons')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    // Add service_id filter if serviceId is provided
    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    // Order by name (sort_order might not exist on all records)
    query = query.order('name', { ascending: true })

    const { data: addons, error } = await query

    console.log('[addons API] Query result:', { 
      addonsCount: addons?.length || 0, 
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint,
      businessId,
      serviceId
    })

    if (error) {
      // Check if error is about missing column (PostgreSQL error code 42703 = undefined_column)
      const isColumnError = error.code === '42703' || 
                           (error.message?.includes('column') && error.message?.includes('does not exist'))
      
      console.error('[addons API] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        isColumnError
      })
      
      // If it's a column error (like service_id doesn't exist), return empty array instead of throwing
      // This allows the booking flow to continue even if service_id column doesn't exist yet
      if (isColumnError) {
        console.warn('[addons API] Column error detected (likely service_id missing). Returning empty array.')
        return NextResponse.json({ addons: [] })
      }
      
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
