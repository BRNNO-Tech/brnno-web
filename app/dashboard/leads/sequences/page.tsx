'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Mail,
  Clock,
  Zap,
  Plus,
  ArrowLeft,
  Lock,
  Star,
  DollarSign,
  CheckCircle,
  Shield,
} from 'lucide-react'
import Link from 'next/link'

export default function SequencesPage() {
  // Mock sequences
  const mockSequences = [
    {
      id: '1',
      name: 'Booking Abandoned',
      trigger: 'When customer abandons booking',
      enabled: false,
      stats: { avgConversionRate: '23%', avgRecoveredRevenue: '$450/month' },
      steps: [
        {
          delay: 0.5,
          type: 'sms',
          message:
            'Hi {name}! Saw you checking out {service}—need help finishing your booking? Quick link: {booking_link}',
          note: 'Strike while hot - 98% open rate on SMS',
        },
        {
          delay: 24,
          type: 'sms',
          message:
            'Still interested in {service}? Spots filling up this week! Book here: {booking_link}',
          note: 'Create urgency without being pushy',
        },
        {
          delay: 72,
          type: 'email',
          subject: 'Last chance: Special offer on {service}',
          message:
            '⚡ EXCLUSIVE OFFER: Get 15% off {service} if you book by Friday!\n\nWhat our customers say:\n"Best detail I\'ve ever had!" - Sarah M.\n"Worth every penny" - Mike R.\n\nBook now: {booking_link}',
          note: 'Rich content - images, testimonials, incentive',
        },
      ],
    },
    {
      id: '2',
      name: 'Quote Sent',
      trigger: 'When quote is sent to lead',
      enabled: false,
      stats: { avgConversionRate: '35%', avgRecoveredRevenue: '$320/month' },
      steps: [
        {
          delay: 48,
          type: 'sms',
          message:
            'Hi {name}, just following up on the quote. Have any questions? Happy to help!',
          note: 'Give them time to review (24-72 hrs), then check in',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'What others are saying about {service}',
          message:
            'Hi {name},\n\nJust wanted to share what customers are saying about our {service}:\n\n⭐⭐⭐⭐⭐ "Amazing results!"\n⭐⭐⭐⭐⭐ "Super professional"\n\nCommon questions we get:\nQ: How long does it take? A: Usually 2-3 hours\nQ: Do you come to me? A: Yes, mobile service available!\n\nReady to book? Reply to this email or: {booking_link}',
          note: 'Social proof + objection handling',
        },
        {
          delay: 168,
          type: 'sms',
          message:
            'The quote I sent is still good! Want to lock in your spot? {booking_link}',
          note: 'Final nudge at 7 days',
        },
      ],
    },
    {
      id: '3',
      name: 'No Response (7-Day Re-engagement)',
      trigger: "When lead hasn't responded in 7 days",
      enabled: false,
      stats: { avgConversionRate: '12%', avgRecoveredRevenue: '$180/month' },
      steps: [
        {
          delay: 0,
          type: 'sms',
          message:
            'Hi {name} 👋 Just checking in—still thinking about {service}? No pressure, happy to answer any questions!',
          note: 'Friendly, non-pushy tone',
        },
        {
          delay: 48,
          type: 'email',
          subject: 'Detailing tip: How to maintain that fresh look',
          message:
            'Hi {name},\n\nThought you might find this helpful!\n\n🚗 Pro Tip: Regular detailing every 3-6 months keeps your car looking showroom-new and protects resale value.\n\nHere\'s a quick guide: [blog link]\n\nWhen you\'re ready, we\'d love to help: {booking_link}\n\nNo rush—just wanted to share!',
          note: 'Provide value, not just sales pitch',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'Special offer just for you',
          message:
            'Hi {name},\n\nSince you showed interest before, here\'s an exclusive offer:\n\n💰 10% off any service when you book this week\n\nUse code: COMEBACK10\n\nBook here: {booking_link}\n\nOffer expires in 7 days!',
          note: 'Final incentive - escalate discount',
        },
      ],
    },
    {
      id: '4',
      name: 'Post-Service Review Request',
      trigger: 'After job is marked complete',
      enabled: false,
      stats: { avgConversionRate: '45%', reviews: '8/month' },
      steps: [
        {
          delay: 24,
          type: 'sms',
          message:
            'Hi {name}! How did your {service} turn out? 😊 We\'d love your feedback: {review_link}',
          note: 'High response rate - ask within 24hrs while fresh',
        },
        {
          delay: 120,
          type: 'email',
          subject: 'Quick favor: Share your experience?',
          message:
            'Hi {name},\n\nHope you\'re loving your freshly detailed car! 🚗✨\n\nWould you mind taking 30 seconds to leave a review? It really helps our small business:\n\n⭐ Google Review: {google_link}\n⭐ Yelp Review: {yelp_link}\n\nThanks so much!\n\nPS: Refer a friend and you both get 15% off next service!',
          note: 'If no response to SMS, send email with multiple options',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Automated Follow-up Sequences
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Set-and-forget lead nurturing (Coming Soon)
            </p>
          </div>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Create Sequence
        </Button>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-blue-900 dark:text-blue-100">
                Feature In Development
              </h3>
              <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
                Automated follow-up sequences will be available soon! Once
                enabled, you'll be able to create custom SMS and email sequences
                that automatically nurture leads without any manual work.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <Lock className="h-4 w-4" />
                <span>Requires SMS and email integration (in progress)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview of Sequences */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Preview: Sample Sequences</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Here's what automated sequences will look like once they're live:
        </p>

        <div className="grid gap-4 lg:grid-cols-1">
          {mockSequences.map((sequence) => (
            <Card key={sequence.id} className="relative overflow-hidden">
              {/* Disabled Overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 bg-zinc-900/5 dark:bg-zinc-100/5" />

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <CardTitle>{sequence.name}</CardTitle>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <CardDescription className="mb-3">
                      <span className="font-medium">Trigger:</span>{' '}
                      {sequence.trigger}
                    </CardDescription>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Avg conversion:{' '}
                          <span className="font-semibold text-green-600">
                            {sequence.stats.avgConversionRate}
                          </span>
                        </span>
                      </div>
                      {sequence.stats.avgRecoveredRevenue && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Recovered:{' '}
                            <span className="font-semibold text-emerald-600">
                              {sequence.stats.avgRecoveredRevenue}
                            </span>
                          </span>
                        </div>
                      )}
                      {sequence.stats.reviews && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            <span className="font-semibold">
                              {sequence.stats.reviews}
                            </span>{' '}
                            reviews/month
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      Edit
                    </Button>
                    <label className="relative inline-flex cursor-not-allowed items-center">
                      <input
                        type="checkbox"
                        checked={sequence.enabled}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-zinc-700 dark:border-zinc-600 dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"></div>
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sequence.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${step.type === 'sms'
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                            }`}
                        >
                          {step.type === 'sms' ? (
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Mail className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        {index < sequence.steps.length - 1 && (
                          <div className="mt-2 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 pb-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {step.delay === 0
                              ? 'Immediately'
                              : step.delay < 1
                                ? `${step.delay * 60} min later`
                                : step.delay === 1
                                  ? '1 hour later'
                                  : step.delay < 24
                                    ? `${step.delay} hours later`
                                    : `${step.delay / 24} days later`}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {step.type}
                          </Badge>
                        </div>

                        {step.subject && (
                          <div className="mb-2">
                            <p className="mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                              Subject:
                            </p>
                            <p className="text-sm font-medium">{step.subject}</p>
                          </div>
                        )}

                        <div className="mb-2 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
                          <p className="whitespace-pre-wrap text-sm">
                            {step.message}
                          </p>
                        </div>

                        {step.note && (
                          <div className="flex items-start gap-2">
                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                              <span className="text-xs text-blue-600">💡</span>
                            </div>
                            <p className="text-xs italic text-blue-600 dark:text-blue-400">
                              {step.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Automated Sequences Will Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold">Set Trigger</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose what event starts the sequence (booking abandoned, quote
                sent, no response, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold">Build Sequence</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Add steps with custom messages, delays, and choose SMS or email
                for each step
              </p>
            </div>

            <div className="space-y-2">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold">Activate & Forget</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Turn it on and the system automatically nurtures leads for you
                24/7
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why You'll Love This Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium">Never Forget a Follow-up</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Automatic reminders mean you never lose a hot lead
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium">Save Hours Every Week</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Set it once, runs forever without manual work
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium">Increase Conversion Rates</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Consistent follow-up converts 2-3x more leads
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-sm text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium">Personalized Messages</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Use variables like name, service, price in every message
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices Built In</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Multi-Channel Strategy
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  SMS for urgency (98% open rate, {'<'}160 chars), Email for rich
                  content (images, testimonials, easy links)
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Smart Timing
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Strike fast (30-60 min) for hot leads, give breathing room
                  (48-72 hrs) after quotes
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  Escalating Incentives
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Start friendly, build urgency, close with offers (10-15% off)
                  - recovers 15-30% more leads
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  Auto-Stop on Response
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Sequences pause automatically if customer replies or books -
                  keeps it human, not robotic
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-600" />
              <div>
                <p className="font-medium">
                  Personalization + One-Click Links
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Every message uses {'{'}name{'}'}, {'{'}service{'}'},{' '}
                  {'{'}price{'}'} - plus pre-filled booking links reduce
                  friction massively
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Compliance Built-In
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Opt-in tracking, easy STOP commands, TCPA compliant - we
                  handle the legal stuff
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
