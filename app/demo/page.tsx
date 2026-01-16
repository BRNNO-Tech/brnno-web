'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function enableDemoMode() {
      try {
        // Set cookie with 24 hour expiration
        const expires = new Date()
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000)
        document.cookie = `demo-mode=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
        
        // Wait a moment to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verify cookie was set
        const cookies = document.cookie.split(';')
        const demoCookie = cookies.find(c => c.trim().startsWith('demo-mode='))
        
        if (!demoCookie?.includes('true')) {
          setError('Failed to set demo mode cookie. Please try again.')
          return
        }
        
        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } catch (err) {
        console.error('Error enabling demo mode:', err)
        setError('Failed to enable demo mode. Please try again.')
      }
    }
    
    enableDemoMode()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Loading demo mode...</p>
      </div>
    </div>
  )
}
