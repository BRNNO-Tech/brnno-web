export const TIER_PERMISSIONS = {
  starter: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
  ],
  pro: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
    'full_automation',
    'advanced_quotes',
    'advanced_invoices',
    'reports',
    'custom_service_menus',
    'team_management',
    'lead_recovery_dashboard',
    'export_pdf',
    'basic_auto_assignment',
  ],
  fleet: [
    'view_dashboard',
    'basic_jobs_view',
    'instant_booking',
    'upfront_payments',
    'limited_lead_recovery',
    'full_automation',
    'advanced_quotes',
    'advanced_invoices',
    'reports',
    'custom_service_menus',
    'team_management',
    'lead_recovery_dashboard',
    'export_pdf',
    'earnings_tracking',
    'priority_support',
    'api_access',
    'basic_auto_assignment',
    'advanced_auto_assignment',
  ],
} as const

export type Tier = keyof typeof TIER_PERMISSIONS | null

export function hasFeature(tier: Tier, feature: string): boolean {
  if (!tier) return false
  return TIER_PERMISSIONS[tier]?.includes(feature as any) ?? false
}

export function getMaxTeamSize(tier: Tier): number {
  switch (tier) {
    case 'starter': return 1
    case 'pro': return 3
    case 'fleet': return 5
    default: return 0
  }
}

export function getMaxLeads(tier: Tier): number {
  switch (tier) {
    case 'starter': return 20  // Limited to 20 leads
    case 'pro': return -1      // Unlimited
    case 'fleet': return -1     // Unlimited
    default: return 0
  }
}

// Admin emails that bypass subscription requirements
const ADMIN_EMAILS = [
  'john@brnno.com',
  'adrian@brnno.com',
  'sam@brnno.com',
  'skylar@brnno.com',
  'austin@brnno.com',
  'brandon@brnno.com',
] as const

// Helper to check if email is an admin email
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

// Helper to get tier from business
export function getTierFromBusiness(business: { 
  subscription_plan?: string | null
  subscription_status?: string | null
  owner_id?: string | null
}, userEmail?: string | null): Tier {
  // Admin email bypass - always return 'pro' for admin emails
  if (userEmail && isAdminEmail(userEmail)) {
    return 'pro'
  }
  
  if (!business.subscription_plan || business.subscription_status !== 'active') {
    return null
  }
  const plan = business.subscription_plan.toLowerCase()
  return (plan === 'starter' || plan === 'pro' || plan === 'fleet') ? plan : null
}
