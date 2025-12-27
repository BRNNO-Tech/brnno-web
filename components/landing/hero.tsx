import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Manage Your Business
          <br />
          All in One Place
        </h1>
        
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
          Streamline operations, manage your team, track jobs, and grow your business with BRNNO's all-in-one platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Watch Demo
          </Button>
        </div>

        {/* Optional: Add hero image/screenshot */}
        <div className="mt-16">
          <div className="rounded-xl border shadow-2xl bg-white dark:bg-zinc-900 p-2">
            {/* Add your app screenshot here */}
            <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center">
              <p className="text-zinc-500">App Screenshot</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

