export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getDashboardStats, getMonthlyRevenue, getUpcomingJobs } from '@/lib/actions/dashboard'
import { getBusiness } from '@/lib/actions/business'
import ModernDashboard from '@/components/dashboard/modern-dashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  let stats
  let monthlyRevenue: Array<{ name: string; total: number }> = []
  let upcomingJobs: any[] = []
  let businessName = 'Your Business'

  try {
    stats = await getDashboardStats()
    try {
      monthlyRevenue = await getMonthlyRevenue()
    } catch (revenueError) {
      // Continue without revenue chart if it fails
    }
    try {
      upcomingJobs = await getUpcomingJobs()
    } catch (jobsError) {
      // Continue without upcoming jobs if it fails
    }
    try {
      const business = await getBusiness()
      if (business?.name) {
        businessName = business.name
      }
    } catch (businessError) {
      // Continue with default name if it fails
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while loading dashboard data.'
    const isNoBusinessError = errorMessage.includes('No business found')

    return (
      <div className="p-6">
        <div className={`rounded-lg border p-6 ${isNoBusinessError
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}>
          <h2 className={`text-lg font-semibold ${isNoBusinessError
              ? 'text-blue-800 dark:text-blue-400'
              : 'text-red-800 dark:text-red-400'
            }`}>
            {isNoBusinessError ? 'Business Setup Required' : 'Unable to load dashboard'}
          </h2>
          <p className={`mt-2 text-sm ${isNoBusinessError
              ? 'text-blue-600 dark:text-blue-300'
              : 'text-red-600 dark:text-red-300'
            }`}>
            {errorMessage}
          </p>
          {isNoBusinessError ? (
            <div className="mt-4">
              <Link href="/dashboard/settings">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Settings
                </Button>
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-red-600 dark:text-red-300">
              Please check that your Supabase environment variables are configured correctly in Vercel.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <ModernDashboard
      stats={stats}
      monthlyRevenue={monthlyRevenue}
      upcomingJobs={upcomingJobs}
      businessName={businessName}
    />
  )
}

