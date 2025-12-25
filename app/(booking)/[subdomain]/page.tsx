import { notFound } from 'next/navigation'
import BookingLanding from '@/components/booking/booking-landing'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getBusiness(subdomain: string) {
  const supabase = await createClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('subdomain', subdomain)
    .single()

  if (error) {
    // Check if it's a "no rows" error
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

async function getServices(businessId: string) {
  const supabase = await createClient()

  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return services || []
}

export default async function BookingPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  const services = await getServices(business.id)

  return <BookingLanding business={business} services={services} />
}
