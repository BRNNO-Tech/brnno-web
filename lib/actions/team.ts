'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTeamMembers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return members || []
}

export async function createTeamMember(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  const skills = formData.get('skills') as string
  const skillsArray = skills ? skills.split(',').map(s => s.trim()) : []

  const memberData = {
    business_id: business.id,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    role: formData.get('role') as string || 'worker',
    skills: skillsArray,
    hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
    status: 'active',
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert(memberData)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/team')
  return data
}

export async function updateTeamMember(id: string, formData: FormData) {
  const supabase = await createClient()

  const skills = formData.get('skills') as string
  const skillsArray = skills ? skills.split(',').map(s => s.trim()) : []

  const updates = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    role: formData.get('role') as string,
    skills: skillsArray,
    hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
  }

  const { error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/team')
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/team')
}

export async function assignJobToMember(jobId: string, memberId: string) {
  const supabase = await createClient()

  // First check if already assigned to remove old assignment
  // Or if we support multiple assignments, we might just add a new one
  // For now, assuming one assignment per job for simplicity, or we just add a new row
  // The UI suggests reassigning, so let's clear existing assignments for this job first?
  // Or just insert a new assignment.

  // Let's delete existing assignments for this job to keep it single-assignment for now
  await supabase
    .from('job_assignments')
    .delete()
    .eq('job_id', jobId)

  const { error } = await supabase
    .from('job_assignments')
    .insert({
      job_id: jobId,
      team_member_id: memberId,
      assigned_at: new Date().toISOString(),
      status: 'assigned'
    })

  if (error) {
    console.error('Error assigning job:', JSON.stringify(error, null, 2))
    throw error
  }
  revalidatePath('/dashboard/jobs')
}
