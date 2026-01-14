import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      leadId,
      service,
      customer,
      scheduledDate,
      scheduledTime,
      notes,
      assetDetails,
      address,
      city,
      state,
      zip,
    } = body

    if (!businessId || !service || !customer || !scheduledDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS for public booking flow
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { 
          error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY environment variable',
          hint: 'Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Combine date and time
    const dateTime = new Date(`${scheduledDate}T${scheduledTime}`)

    // 1. Find or create client
    let clientId: string

    // Check if client exists by email
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', customer.email)
      .single()

    if (existingClient) {
      clientId = existingClient.id

      // Update client info if provided
      await supabase
        .from('clients')
        .update({
          name: customer.name,
          phone: customer.phone || null,
        })
        .eq('id', clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
        })
        .select()
        .single()

      if (clientError || !newClient) {
        throw new Error('Failed to create client')
      }

      clientId = newClient.id
    }

    // 2. Create job
    console.log('[create-booking] Creating job for business:', businessId)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        business_id: businessId,
        client_id: clientId,
        title: service.name,
        description: notes || null,
        service_type: service.name,
        scheduled_date: dateTime.toISOString(),
        estimated_duration: service.duration_minutes || 60,
        estimated_cost: service.price,
        status: 'scheduled',
        priority: 'medium',
        client_notes: notes || null,
        asset_details: assetDetails || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
      })
      .select()
      .single()

    if (jobError) {
      console.error('[create-booking] Job creation error:', jobError)
      throw new Error(`Failed to create job: ${jobError.message}`)
    }
    
    if (!job) {
      console.error('[create-booking] Job creation returned no data')
      throw new Error('Failed to create job: No data returned')
    }
    
    console.log('[create-booking] Job created successfully:', job.id)

    // 3. Create invoice (marked as paid if real payment, unpaid if mock)
    const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        client_id: clientId,
        total: service.price,
        paid_amount: mockMode ? 0 : service.price,
        status: mockMode ? 'unpaid' : 'paid',
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      // Don't fail the booking if invoice creation fails
    } else if (invoice) {
      // Create invoice item
      await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          service_id: service.id,
          name: service.name,
          description: service.description || null,
          price: service.price,
          quantity: 1,
        })

      // If paid, record payment
      if (!mockMode) {
        await supabase
          .from('payments')
          .insert({
            business_id: businessId,
            invoice_id: invoice.id,
            amount: service.price,
            payment_method: 'stripe',
            reference_number: 'online_booking',
          })
      }
    }

    // 4. ALWAYS create a lead from booking (silently, no user interaction)
    // This is the new rule: Every booking auto-creates a lead
    let leadIdFinal: string | null = null
    
    try {
      const { data: bookingLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          business_id: businessId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
          status: 'booked', // New status: booked (was 'converted')
          source: 'booking', // New source: booking (was 'online_booking')
          job_id: job.id, // Link to the job
          estimated_value: service.price,
          interested_in_service_name: service.name,
          notes: notes || null,
          // Don't set converted_at - this is a booking, not a conversion
        })
        .select()
        .single()

      if (leadError) {
        console.error('Error creating booking lead:', leadError)
        // Don't fail the booking if lead creation fails - this is silent
      } else {
        leadIdFinal = bookingLead?.id || null
      }
    } catch (error) {
      console.error('Error in booking lead creation:', error)
      // Silent failure - booking still succeeds
    }

    // 5. Send confirmation emails
    // We need to fetch business details for the email
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email, phone')
      .eq('id', businessId)
      .single()

    if (business) {
      await sendBookingConfirmation({
        business: {
          name: business.name,
          email: business.email,
          phone: business.phone
        },
        service: {
          name: service.name
        },
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        scheduledDate,
        scheduledTime
      })
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      invoiceId: invoice?.id,
      leadId: leadIdFinal,
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
