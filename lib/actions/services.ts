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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      ...data,
      user_id: user.id,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/services');
  revalidatePath('/booking');
  return service;
}

export async function updateService(id: string, data: ServiceFormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: service, error } = await supabase
    .from('services')
    .update(data)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: addons, error } = await supabase
    .from('service_addons')
    .select('*')
    .eq('service_id', serviceId)
    .order('name');

  if (error) throw error;
  return addons || [];
}

export async function saveServiceAddons(serviceId: string, addons: ServiceAddonData[]) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify service belongs to user
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single();

  if (!service) throw new Error('Service not found');

  // Delete existing addons
  await supabase
    .from('service_addons')
    .delete()
    .eq('service_id', serviceId);

  // Insert new addons
  if (addons.length > 0) {
    const addonsToInsert = addons.map(addon => ({
      service_id: serviceId,
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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify service belongs to user
  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single();

  if (!service) throw new Error('Service not found');

  const { data: newAddon, error } = await supabase
    .from('service_addons')
    .insert({
      service_id: serviceId,
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
