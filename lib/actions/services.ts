'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getBusinessId } from './utils';

export interface ServiceFormData {
  name: string;
  description?: string;
  base_price: number;
  estimated_duration?: number;
  icon?: string;
  image_url?: string;
  is_popular?: boolean;
  whats_included?: string[];
  is_active?: boolean;
}

export async function getServices() {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
  
  return services || [];
}

export async function createService(data: ServiceFormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Ensure estimated_duration is an integer if provided
  // Note: Database column is 'price', not 'base_price'
  // Note: Services table doesn't have 'user_id', only 'business_id'
  const serviceData: any = {
    name: data.name.trim(),
    price: Number(data.base_price), // Map base_price to price column
    business_id: businessId,
    is_active: data.is_active ?? true,
    is_popular: data.is_popular ?? false,
  };
  
  // Add optional fields only if they're provided and not empty
  if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
    serviceData.description = data.description.trim();
  }
  if (data.icon !== undefined && data.icon !== null && data.icon.trim() !== '') {
    serviceData.icon = data.icon.trim();
  }
  if (data.image_url !== undefined && data.image_url !== null && data.image_url.trim() !== '') {
    serviceData.image_url = data.image_url.trim();
  }
  if (data.whats_included !== undefined && data.whats_included !== null && Array.isArray(data.whats_included) && data.whats_included.length > 0) {
    serviceData.whats_included = data.whats_included;
  }
  
  // Convert estimated_duration to integer if provided (database expects int)
  if (data.estimated_duration !== undefined && data.estimated_duration !== null && !isNaN(data.estimated_duration)) {
    serviceData.estimated_duration = Math.round(data.estimated_duration);
  }

  const { data: service, error } = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      data: serviceData
    });
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  return service;
}

export async function updateService(id: string, data: ServiceFormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Ensure estimated_duration is an integer if provided
  // Note: Database column is 'price', not 'base_price'
  const updateData: any = { ...data };
  
  // Map base_price to price column if provided
  if (updateData.base_price !== undefined) {
    updateData.price = Number(updateData.base_price);
    delete updateData.base_price;
  }
  
  // Convert estimated_duration to integer if provided (database expects int)
  if (updateData.estimated_duration !== undefined && updateData.estimated_duration !== null) {
    updateData.estimated_duration = Math.round(updateData.estimated_duration);
  }

  const { data: service, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      data: updateData
    });
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath(`/services/${id}/edit`);
  revalidatePath('/dashboard/services');
  return service;
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) {
    console.error('Error deleting service:', error);
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath('/dashboard/services');
}

export async function getService(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
  
  if (!service) {
    throw new Error('Service not found');
  }
  
  return service;
}

export async function uploadServiceImage(file: File) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('service-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('service-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function togglePopular(id: string, isPopular: boolean) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { error } = await supabase
    .from('services')
    .update({ is_popular: isPopular })
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) {
    console.error('Error toggling popular status:', error);
    throw error;
  }

  revalidatePath('/services');
  revalidatePath('/booking');
  revalidatePath('/dashboard/services');
}

// Add-ons Management
export interface ServiceAddonData {
  id?: string;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
}

export async function getServiceAddons(serviceId: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Get addons for the specific service
  const { data: addons, error } = await supabase
    .from('service_addons')
    .select('*')
    .eq('business_id', businessId)
    .eq('service_id', serviceId) // Filter by service_id
    .order('name');

  if (error) throw error;
  return addons || [];
}

export async function saveServiceAddons(serviceId: string, addons: ServiceAddonData[]) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify service belongs to business
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single();

  if (!service) throw new Error('Service not found');

  // Note: service_addons table uses business_id, not service_id
  // Delete existing addons for this business (if you want service-specific, you'd need to filter differently)
  // For now, we'll just insert new ones - you may want to delete all business addons first
  // or implement a different strategy based on your needs

  // Delete existing addons for this service first
  await supabase
    .from('service_addons')
    .delete()
    .eq('service_id', serviceId)
    .eq('business_id', businessId);

  // Insert new addons with service_id
  if (addons.length > 0) {
    const addonsToInsert = addons.map(addon => ({
      business_id: businessId,
      service_id: serviceId, // Link add-ons to the specific service
      name: addon.name,
      description: addon.description || null,
      price: addon.price,
      is_active: addon.is_active ?? true,
    }));

    const { error } = await supabase
      .from('service_addons')
      .insert(addonsToInsert);

    if (error) throw error;
  }

  revalidatePath('/services');
  revalidatePath(`/services/${serviceId}/edit`);
  revalidatePath('/booking');
}

export async function createServiceAddon(serviceId: string, addon: ServiceAddonData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify service belongs to business
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('business_id', businessId)
    .single();

  if (!service) throw new Error('Service not found');

  const { data: newAddon, error } = await supabase
    .from('service_addons')
    .insert({
      business_id: businessId, // Use business_id instead of service_id
      name: addon.name,
      description: addon.description || null,
      price: addon.price,
      is_active: addon.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
  return newAddon;
}

export async function updateServiceAddon(addonId: string, updates: ServiceAddonData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('service_addons')
    .update({
      name: updates.name,
      description: updates.description || null,
      price: updates.price,
      is_active: updates.is_active ?? true,
    })
    .eq('id', addonId);

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
}

export async function deleteServiceAddon(addonId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('service_addons')
    .delete()
    .eq('id', addonId);

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
}
