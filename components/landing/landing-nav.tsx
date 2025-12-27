'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingNav() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            BRNNO
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              FAQ
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

