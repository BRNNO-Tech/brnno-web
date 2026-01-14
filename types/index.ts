export interface Service {
  id: string;
  user_id?: string; // Optional for backward compatibility
  business_id?: string; // Optional for backward compatibility
  name: string;
  description?: string;
  base_price: number;
  price?: number; // Legacy field for backward compatibility
  estimated_duration?: number; // in minutes
  duration_minutes?: number; // Legacy field for backward compatibility
  icon?: string; // emoji
  image_url?: string;
  is_popular: boolean;
  whats_included?: string[]; // JSONB array
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// For add-ons
export interface ServiceAddon {
  id?: string;
  service_id?: string;
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
