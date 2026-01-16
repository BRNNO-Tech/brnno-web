import { Service } from '@/types'
import { ServiceAddon } from '@/types'
import { getServicePrice, getServiceDuration } from './service-pricing'

type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'coupe'

/**
 * Maps vehicle type to pricing variation key
 * Handles cases where vehicle selector types don't match pricing keys exactly
 * e.g., 'van' -> 'truck', 'coupe' -> 'coupe'
 * Exported for use in booking form
 */
export function mapVehicleTypeToPricingKey(vehicleType: string | null | undefined): 'coupe' | 'sedan' | 'suv' | 'truck' | null {
  if (!vehicleType) return null
  
  const normalized = vehicleType.toLowerCase()
  
  // Map vehicle selector types to pricing variation keys
  const mapping: Record<string, 'coupe' | 'sedan' | 'suv' | 'truck'> = {
    'coupe': 'coupe',
    'sedan': 'sedan',
    'suv': 'suv',
    'truck': 'truck',
    'van': 'truck', // Van maps to truck for pricing
  }
  
  return mapping[normalized] || null
}

interface BookingTotals {
  price: number
  duration: number
}

/**
 * Calculates the final total price and estimated duration.
 * @param service - The full service object from DB
 * @param vehicleType - ID of selected vehicle (e.g., 'truck')
 * @param selectedAddons - List of full addon objects selected
 */
export function calculateTotals(
  service: Service | null,
  vehicleType: VehicleType | null,
  selectedAddons: ServiceAddon[] = []
): BookingTotals {
  console.log('--- DEBUG PRICING ---')
  
  if (!service) {
    console.error('❌ No service provided')
    return { price: 0, duration: 0 }
  }

  // 1. Start with base values
  let finalPrice = Number(service.base_price || service.price || 0)
  let finalDuration = Number(service.base_duration || service.estimated_duration || service.duration_minutes || 60)

  console.log('1. Pricing Model:', service.pricing_model)
  console.log('2. Selected Vehicle ID:', vehicleType)
  console.log('3. Available Variations:', service.variations ? Object.keys(service.variations) : 'NONE')
  console.log('4. Full Variations Object:', service.variations)
  console.log('5. Base Price:', finalPrice)
  console.log('6. Base Duration:', finalDuration)

  // 2. Apply Vehicle Variable Logic
  // CHECK 1: Is the model variable?
  if (service.pricing_model === 'variable') {
    // CHECK 2: Do we have a vehicle selected?
    if (vehicleType) {
      // Map vehicle type to pricing key (handles van -> truck, etc.)
      const pricingKey = mapVehicleTypeToPricingKey(vehicleType)
      const variations = service.variations || {}
      const tier = pricingKey ? variations[pricingKey as keyof typeof variations] : undefined
      
      // CHECK 3: Did we actually find the tier?
      if (tier && pricingKey) {
        console.log(`✅ MATCH FOUND! Using tier: ${pricingKey} (from vehicleType: ${vehicleType})`, tier)
        if (tier.enabled) {
          finalPrice = Number(tier.price)
          finalDuration = Number(tier.duration)
          console.log(`✅ Tier enabled. Price: ${finalPrice}, Duration: ${finalDuration}`)
        } else {
          console.warn(`⚠️ Tier found but DISABLED. Using base price.`)
        }
      } else {
        console.error(`❌ MISMATCH: Vehicle type '${vehicleType}' mapped to pricing key '${pricingKey}', but that key does not exist in 'service.variations'.`)
        console.error(`   Available keys:`, Object.keys(variations))
        console.error(`   Looking for key:`, pricingKey)
        console.error(`   Original vehicleType:`, vehicleType)
      }
    } else {
      console.warn('⚠️ No vehicle selected yet.')
    }
  } else {
    console.log('ℹ️ Using Flat Rate (pricing_model is not "variable")')
  }

  // 3. Stack the Add-ons
  // We loop through every selected add-on and stack the numbers
  selectedAddons.forEach((addon) => {
    const addonPrice = Number(addon.price || 0)
    const addonDuration = Number(addon.duration_minutes || addon.duration || 0)
    finalPrice += addonPrice
    finalDuration += addonDuration
    console.log(`   + Addon: ${addon.name} (+$${addonPrice}, +${addonDuration}m)`)
  })

  console.log('-> FINAL CALCULATED:', { price: finalPrice, duration: finalDuration })
  console.log('--- END DEBUG PRICING ---')

  return {
    price: Math.max(0, finalPrice), // Ensure non-negative
    duration: Math.max(0, finalDuration), // Ensure non-negative
  }
}

/**
 * Helper to convert minutes to readable string
 * e.g. 150 -> "2h 30m" or "2.5 hours"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m'
  
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format duration in hours with decimal (e.g., 150 -> "2.5 hours")
 */
export function formatDurationHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 hours'
  
  const hours = minutes / 60
  if (hours % 1 === 0) {
    return `${hours.toFixed(0)} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${hours.toFixed(1)} hours`
}
