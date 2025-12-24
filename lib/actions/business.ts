'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Gets the current user's business data
 * Server-side action to avoid 406 errors
 */
export async function getBusiness() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`Authentication error: ${authError.message}`)
  }

  if (!user) {
    return null
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (businessError) {
    // Check if it's a "no rows" error (PGRST116)
    if (businessError.code === 'PGRST116' || businessError.message?.includes('JSON object')) {
      return null // No business found - that's okay
    }
    // Log the error for debugging
    console.error('Error fetching business:', {
      code: businessError.code,
      message: businessError.message,
      details: businessError.details,
      hint: businessError.hint,
    })
    throw new Error(`Database error: ${businessError.message}`)
  }

  return business
}
