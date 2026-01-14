'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Quick Quote Functions
type QuickQuoteData = {
  vehicleType: 'sedan' | 'suv' | 'truck'
  vehicleCondition: 'normal' | 'dirty' | 'very_dirty'
  services: string[] // Array of service IDs
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export async function createQuickQuote(data: QuickQuoteData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  
  if (!business) throw new Error('No business found')
  
  // Get services to calculate price
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price')
    .in('id', data.services)
    .eq('business_id', business.id)
  
  if (!services || services.length === 0) {
    throw new Error('No services selected')
  }
  
  // Calculate total price
  let totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0)
  
  // Apply vehicle type multiplier
  const vehicleMultiplier = {
    sedan: 1.0,
    suv: 1.2,
    truck: 1.3
  }
  totalPrice *= vehicleMultiplier[data.vehicleType]
  
  // Apply condition multiplier
  const conditionMultiplier = {
    normal: 1.0,
    dirty: 1.15,
    very_dirty: 1.3
  }
  totalPrice *= conditionMultiplier[data.vehicleCondition]
  
  // Generate unique quote code with collision checking
  let quoteCode: string
  let attempts = 0
  const maxAttempts = 10
  
  try {
    const { data: codeResult, error: rpcError } = await supabase.rpc('generate_quote_code')
    if (rpcError || !codeResult) {
      // Fallback if RPC function doesn't exist or fails
      quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } else {
      quoteCode = codeResult
    }
  } catch {
    // Fallback if RPC function doesn't exist
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  
  // Check for duplicate quote_code and regenerate if needed
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('quote_code', quoteCode)
      .single()
    
    if (!existing) {
      break // Code is unique
    }
    
    // Regenerate code
    quoteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    attempts++
  }
  
  // Prepare insert data - only include fields that exist
  const insertData: any = {
    business_id: business.id,
    total_price: Math.round(totalPrice * 100) / 100,
    quote_code: quoteCode,
    status: 'draft', // Required field for compatibility
  }
  
  // Add optional fields only if they exist in the schema
  if (data.vehicleType) insertData.vehicle_type = data.vehicleType
  if (data.vehicleCondition) insertData.vehicle_condition = data.vehicleCondition
  if (data.services && data.services.length > 0) {
    // Convert array to JSONB format
    insertData.services = data.services
  }
  if (data.customerName) insertData.customer_name = data.customerName
  if (data.customerPhone) insertData.customer_phone = data.customerPhone
  if (data.customerEmail) insertData.customer_email = data.customerEmail
  
  // Create quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert(insertData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating quote:', error)
    console.error('Insert data:', insertData)
    throw new Error(`Failed to create quote: ${error.message}. Make sure you've run the database migration.`)
  }
  
  revalidatePath('/dashboard/quick-quote')
  return quote
}

export async function getQuickQuotes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  
  if (!business) throw new Error('No business found')
  
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return quotes || []
}

export async function getQuoteByCode(code: string) {
  // Try authenticated client first, fall back to service role for public access
  let supabase
  try {
    supabase = await createClient()
    // Test if we have a valid session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // No authenticated user, use service role for public access
      throw new Error('No authenticated user')
    }
  } catch {
    // Use service role client for public quote access
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for public quote access')
    }
    
    supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      business:businesses(name, subdomain)
    `)
    .eq('quote_code', code)
    .single()
  
  if (error) throw error
  
  // Track view
  if (quote && !quote.viewed_at) {
    await supabase
      .from('quotes')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', quote.id)
  }
  
  return quote
}

