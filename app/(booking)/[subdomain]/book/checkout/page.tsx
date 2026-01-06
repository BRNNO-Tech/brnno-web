import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import CheckoutForm from '@/components/booking/checkout-form'

export const dynamic = 'force-dynamic'

async function getBusiness(subdomain: string) {
  // Use service role client to bypass RLS for public booking access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration for public booking access')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  // In mock mode, allow checkout even without Stripe
  const mockMode = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'

  if (!mockMode && !business.stripe_account_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Payment Not Available</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            This business hasn't set up payments yet. Please contact them directly.
          </p>
        </div>
      </div>
    )
  }

  return <CheckoutForm business={business} />
}
