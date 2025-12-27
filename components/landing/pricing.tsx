import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small teams',
    features: [
      'Up to 5 team members',
      'Unlimited jobs',
      'Basic reporting',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$79',
    description: 'For growing businesses',
    features: [
      'Up to 20 team members',
      'Unlimited jobs',
      'Advanced reporting',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Unlimited team members',
      'Unlimited jobs',
      'Advanced analytics',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-zinc-50 dark:bg-zinc-900/50 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Choose the plan that's right for your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-xl border bg-white dark:bg-zinc-900 ${
                plan.popular ? 'ring-2 ring-blue-600 relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {plan.description}
              </p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== 'Custom' && (
                  <span className="text-zinc-600 dark:text-zinc-400">/month</span>
                )}
              </div>

              <Link href="/signup" className="block mb-6">
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  Get Started
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

