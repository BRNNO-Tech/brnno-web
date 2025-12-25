import { notFound, redirect } from 'next/navigation'
import BookingForm from '@/components/booking/booking-form'
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
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching business:', error)
    return null
  }

  return business
}

async function getService(serviceId: string, businessId: string) {
  const supabase = await createClient()

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('JSON object')) {
      return null
    }
    console.error('Error fetching service:', error)
    return null
  }

  return service
}

export default async function BookPage({
  params,
  searchParams
}: {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ service?: string }>
}) {
  const { subdomain } = await params
  const { service: serviceId } = await searchParams

  const business = await getBusiness(subdomain)

  if (!business) {
    notFound()
  }

  // If no service ID provided, redirect back to landing page
  if (!serviceId) {
    redirect(`/${subdomain}`)
  }

  const service = await getService(serviceId, business.id)

  // If service doesn't exist or doesn't belong to this business, redirect
  if (!service) {
    redirect(`/${subdomain}`)
  }

  return <BookingForm business={business} service={service} />
}
