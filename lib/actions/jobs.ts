'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createReviewRequest } from './reviews'
import { createInvoiceFromJob } from './invoices'
import { getBusinessId } from './utils'
import { isDemoMode } from '@/lib/demo/utils'
import { getMockJobs } from '@/lib/demo/mock-data'

export async function getJobs() {
  if (await isDemoMode()) {
    return getMockJobs()
  }

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(name, phone, email),
      assignments:job_assignments(
        id,
        team_member:team_members!job_assignments_team_member_id_fkey(id, name, role)
      )
    `)
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: true })

  if (error) {
    console.error('Error fetching jobs:', JSON.stringify(error, null, 2))
    throw error
  }
  return jobs || []
}

export async function addJob(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Convert datetime-local value to ISO string
  // datetime-local format: "YYYY-MM-DDTHH:mm" (no timezone)
  // We need to treat it as local time and convert to ISO
  let scheduledDate: string | null = null
  const scheduledDateInput = formData.get('scheduled_date') as string | null
  if (scheduledDateInput) {
    // datetime-local gives us local time, create a Date object from it
    // This will be interpreted as local time by JavaScript
    const localDate = new Date(scheduledDateInput)
    // Convert to ISO string (UTC) for storage
    scheduledDate = localDate.toISOString()
  }

  // Convert hours to minutes for storage
  const durationHours = formData.get('estimated_duration') ? parseFloat(formData.get('estimated_duration') as string) : null
  const durationMinutes = durationHours ? Math.round(durationHours * 60) : null

  const jobData = {
    business_id: businessId,
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: scheduledDate,
    estimated_duration: durationMinutes,
    estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
    status: 'scheduled',
    priority: formData.get('priority') as string || 'medium',
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip: formData.get('zip') as string || null,
    is_mobile_service: formData.get('is_mobile_service') === 'true',
    client_notes: formData.get('client_notes') as string || null,
    internal_notes: formData.get('internal_notes') as string || null,
  }

  const { error } = await supabase
    .from('jobs')
    .insert(jobData)

  if (error) {
    console.error('Error creating job:', JSON.stringify(error, null, 2))
    throw error
  }

  revalidatePath('/dashboard/jobs')
}

export async function updateJobStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('jobs')
    .update({ 
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined
    })
    .eq('id', id)

  if (error) throw error

  // Auto-generate invoice and trigger review request when job is completed
  if (status === 'completed') {
    try {
      // Auto-generate invoice from completed job
      await createInvoiceFromJob(id)
    } catch (error) {
      console.error('Failed to create invoice from job:', error)
      // Don't fail the job update if invoice creation fails
    }
    
    try {
      await createReviewRequest(id)
    } catch (error) {
      console.error('Failed to create review request:', error)
      // Don't fail the job update if review request fails
    }
  }

  revalidatePath('/dashboard/jobs')
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createClient()

  // Convert datetime-local value to ISO string
  let scheduledDate: string | null = null
  const scheduledDateInput = formData.get('scheduled_date') as string | null
  if (scheduledDateInput) {
    // datetime-local gives us local time, create a Date object from it
    const localDate = new Date(scheduledDateInput)
    // Convert to ISO string (UTC) for storage
    scheduledDate = localDate.toISOString()
  }

  const jobData = {
    client_id: formData.get('client_id') as string || null,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    service_type: formData.get('service_type') as string || null,
    scheduled_date: scheduledDate,
    estimated_duration: (() => {
      const durationHours = formData.get('estimated_duration') ? parseFloat(formData.get('estimated_duration') as string) : null
      return durationHours ? Math.round(durationHours * 60) : null
    })(),
    estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
    priority: formData.get('priority') as string || 'medium',
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip: formData.get('zip') as string || null,
    is_mobile_service: formData.get('is_mobile_service') === 'true',
    client_notes: formData.get('client_notes') as string || null,
    internal_notes: formData.get('internal_notes') as string || null,
  }

  const { error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/jobs')
}

export async function deleteJob(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/jobs')
}

export async function getJob(id: string) {
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(*),
      assignments:job_assignments(
        id,
        team_member:team_members!job_assignments_team_member_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return job
}

export async function createJobFromLead(leadId: string, jobData: {
  title: string
  service_type?: string
  scheduled_date: string
  estimated_duration?: number
  estimated_cost?: number
  description?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  client_notes?: string
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  // Get lead info
  const { data: lead } = await supabase
    .from('leads')
    .select('name, email, phone, interested_in_service_name, estimated_value')
    .eq('id', leadId)
    .eq('business_id', businessId)
    .single()

  if (!lead) throw new Error('Lead not found')

  // Find or create client from lead
  let clientId: string | null = null
  
  if (lead.email) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', businessId)
      .eq('email', lead.email)
      .single()

    if (existingClient) {
      clientId = existingClient.id
      // Update client info
      await supabase
        .from('clients')
        .update({
          name: lead.name,
          phone: lead.phone || null,
        })
        .eq('id', clientId)
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          business_id: businessId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
        })
        .select()
        .single()

      if (clientError) throw clientError
      if (newClient) clientId = newClient.id
    }
  }

  // Convert scheduled_date to ISO string if it's not already
  let scheduledDateISO: string
  if (jobData.scheduled_date.includes('T')) {
    scheduledDateISO = new Date(jobData.scheduled_date).toISOString()
  } else {
    // Assume it's a date string, add default time
    scheduledDateISO = new Date(`${jobData.scheduled_date}T09:00:00`).toISOString()
  }

  // Create job (optionally linked to lead if column exists)
  const jobInsertData: any = {
    business_id: businessId,
    client_id: clientId,
    title: jobData.title,
    description: jobData.description || null,
    service_type: jobData.service_type || lead.interested_in_service_name || null,
    scheduled_date: scheduledDateISO,
    estimated_duration: jobData.estimated_duration || null,
    estimated_cost: jobData.estimated_cost || lead.estimated_value || null,
    status: 'scheduled',
    priority: 'medium',
    address: jobData.address || null,
    city: jobData.city || null,
    state: jobData.state || null,
    zip: jobData.zip || null,
    client_notes: jobData.client_notes || null,
  }
  
  // Try to add lead_id - if column doesn't exist, handle gracefully
  jobInsertData.lead_id = leadId

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert(jobInsertData)
    .select()
    .single()

  if (jobError) {
    // If error is about missing column, try without lead_id
    if (jobError.message?.includes('column') && jobError.message?.includes('lead_id')) {
      delete jobInsertData.lead_id
      const { data: retryJob, error: retryError } = await supabase
        .from('jobs')
        .insert(jobInsertData)
        .select()
        .single()
      
      if (retryError) {
        console.error('Error creating job from lead:', retryError)
        throw retryError
      }
      
      // Continue with job creation (without lead_id link)
      const job = retryJob
      
      // Update lead status to 'booked'
      await supabase
        .from('leads')
        .update({ 
          status: 'booked',
          job_id: job.id,
        })
        .eq('id', leadId)

      // Add interaction record
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: leadId,
          type: 'note',
          direction: 'outbound',
          content: `Job created: ${jobData.title}`,
          outcome: 'booked',
        })

      revalidatePath('/dashboard/leads')
      revalidatePath('/dashboard/leads/inbox')
      revalidatePath('/dashboard/jobs')
      
      return job
    }
    
    console.error('Error creating job from lead:', jobError)
    throw jobError
  }

  // Update lead status to 'booked'
  await supabase
    .from('leads')
    .update({ 
      status: 'booked',
      job_id: job.id,
    })
    .eq('id', leadId)

  // Add interaction record
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      type: 'note',
      direction: 'outbound',
      content: `Job created: ${jobData.title}`,
      outcome: 'booked',
    })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/leads/inbox')
  revalidatePath('/dashboard/jobs')
  
  return job
}

