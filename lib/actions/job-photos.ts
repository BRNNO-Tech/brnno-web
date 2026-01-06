'use server'

import { createClient } from '@/lib/supabase/server'
import { getWorkerProfile } from './worker-auth'

/**
 * Uploads a photo to Supabase Storage and creates a database record
 */
export async function uploadJobPhoto(
  assignmentId: string,
  jobId: string,
  file: File,
  photoType: 'before' | 'after' | 'other',
  description?: string
) {
  const supabase = await createClient()
  const worker = await getWorkerProfile()

  if (!worker) {
    throw new Error('Worker not authenticated')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${jobId}/${assignmentId}/${Date.now()}.${fileExt}`
  const filePath = `job-photos/${fileName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('job-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    throw new Error(`Failed to upload photo: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('job-photos')
    .getPublicUrl(filePath)

  // Create database record
  const { data: photo, error: dbError } = await supabase
    .from('job_photos')
    .insert({
      job_id: jobId,
      assignment_id: assignmentId,
      photo_type: photoType,
      storage_path: filePath,
      storage_url: publicUrl,
      uploaded_by: worker.user_id || null,
      description: description || null
    })
    .select()
    .single()

  if (dbError) {
    // If database insert fails, try to delete the uploaded file
    await supabase.storage.from('job-photos').remove([filePath])
    throw new Error(`Failed to save photo record: ${dbError.message}`)
  }

  return photo
}

/**
 * Gets all photos for a job assignment
 */
export async function getJobPhotos(assignmentId: string) {
  const supabase = await createClient()

  const { data: photos, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error)
    throw new Error(`Failed to fetch photos: ${error.message}`)
  }

  return photos || []
}

/**
 * Deletes a photo
 */
export async function deleteJobPhoto(photoId: string) {
  const supabase = await createClient()
  const worker = await getWorkerProfile()

  if (!worker) {
    throw new Error('Worker not authenticated')
  }

  // Get photo to get storage path
  const { data: photo, error: fetchError } = await supabase
    .from('job_photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()

  if (fetchError || !photo) {
    throw new Error('Photo not found')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('job-photos')
    .remove([photo.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // Continue with database delete even if storage delete fails
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('job_photos')
    .delete()
    .eq('id', photoId)

  if (dbError) {
    throw new Error(`Failed to delete photo: ${dbError.message}`)
  }

  return { success: true }
}

