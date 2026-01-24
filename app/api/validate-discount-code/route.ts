import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, code } = body

    if (!businessId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    // Use service role for public validation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('business_id', businessId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !discountCode) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 404, headers: corsHeaders })
    }

    // Check expiration
    if (discountCode.valid_until && new Date(discountCode.valid_until) < new Date()) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400, headers: corsHeaders })
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return NextResponse.json(
        { error: 'Discount code has reached its usage limit' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      valid: true,
      discountPercent: discountCode.discount_percent,
      description: discountCode.description
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error validating discount code:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}
