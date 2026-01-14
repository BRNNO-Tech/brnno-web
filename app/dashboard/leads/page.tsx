export const dynamic = 'force-dynamic'

import { getLeads } from '@/lib/actions/leads'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardShell } from '@/components/ui/card-shell'
import { GlowBG } from '@/components/ui/glow-bg'
import { BarChart, Zap, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { canUseLeadRecoveryDashboard, canUseFullAutomation, getCurrentTier, getMaxLeadsForCurrentBusiness, canAddMoreLeads } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'
import { getBusiness } from '@/lib/actions/business'
import { getTierFromBusiness } from '@/lib/permissions'

export default async function LeadsPage() {
  const business = await getBusiness()
  const tier = business ? getTierFromBusiness(business) : null
  const canUseDashboard = await canUseLeadRecoveryDashboard()
  const canUseAutomation = await canUseFullAutomation()
  const maxLeads = await getMaxLeadsForCurrentBusiness()
  const leadLimitInfo = await canAddMoreLeads()
  
  // Starter plan can access leads but with limitations
  // Pro+ gets full dashboard features
  const allLeads = await getLeads('all')
  const isStarter = tier === 'starter'

  const hotLeads = allLeads.filter(
    (l: any) => l.score === 'hot' && l.status !== 'booked' && l.status !== 'lost'
  )
  const warmLeads = allLeads.filter(
    (l: any) => l.score === 'warm' && l.status !== 'booked' && l.status !== 'lost'
  )
  const coldLeads = allLeads.filter(
    (l: any) => l.score === 'cold' && l.status !== 'booked' && l.status !== 'lost'
  )
  const bookedLeads = allLeads.filter((l: any) => l.status === 'booked')
  const lostLeads = allLeads.filter((l: any) => l.status === 'lost')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Lead Recovery</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Track and convert potential customers
                {isStarter && maxLeads > 0 && (
                  <span className="ml-2">
                    ({allLeads.length}/{maxLeads} leads)
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
              {canUseAutomation ? (
                <>
                  <Link href="/dashboard/leads/sequences">
                    <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Automated Sequences
                    </button>
                  </Link>
                  <Link href="/dashboard/leads/analytics">
                    <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      View Analytics
                    </button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Automation</span>
                  </button>
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </button>
                </div>
              )}
              <AddLeadButton canAddMore={leadLimitInfo.canAdd} />
            </div>
          </div>

          {/* Starter Plan Limitations Notice */}
          {isStarter && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 backdrop-blur-sm p-4 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Starter Plan Limitations
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    You're on the Starter plan with limited lead recovery. You can track up to <strong>{maxLeads} leads</strong>.
                    {!leadLimitInfo.canAdd && (
                      <span className="block mt-1">
                        <strong>You've reached your limit!</strong> Upgrade to Pro for unlimited leads, advanced analytics, and automation features.
                      </span>
                    )}
                  </p>
                  <Link href="/pricing" className="mt-2 inline-block">
                    <button className="rounded-2xl border border-amber-500/30 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/20 transition-colors">
                      Upgrade to Pro
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Limit Reached Warning */}
          {!leadLimitInfo.canAdd && maxLeads > 0 && (
            <div className="mb-6 rounded-2xl border border-rose-500/30 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 backdrop-blur-sm p-4 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                    Lead Limit Reached
                  </p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
                    You've reached your limit of {maxLeads} leads. Upgrade to Pro for unlimited leads and advanced features.
                  </p>
                </div>
                <Link href="/pricing">
                  <button className="rounded-2xl border border-rose-500/30 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 dark:hover:bg-rose-500/20 transition-colors">
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="relative overflow-hidden rounded-3xl border border-red-500/20 dark:border-red-500/30 bg-gradient-to-br from-red-500/18 dark:from-red-500/18 to-red-500/5 dark:to-red-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-red-500/20 dark:ring-red-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-red-100/50 dark:bg-red-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Hot Leads
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{hotLeads.length}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Need immediate follow-up
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 dark:border-orange-500/30 bg-gradient-to-br from-orange-500/18 dark:from-orange-500/18 to-orange-500/5 dark:to-orange-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-orange-500/20 dark:ring-orange-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-orange-100/50 dark:bg-orange-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Warm Leads
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{warmLeads.length}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Active opportunities
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-cyan-500/20 dark:ring-cyan-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-cyan-100/50 dark:bg-cyan-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Cold Leads
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{coldLeads.length}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Need re-engagement
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Booked
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{bookedLeads.length}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                This month
              </p>
            </div>
          </div>

          <CardShell title="Lead Management" subtitle="Organize and track your leads by priority">
            <Tabs defaultValue="hot" className="space-y-4">
              <TabsList className="bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
                <TabsTrigger value="hot" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">🔥 Hot ({hotLeads.length})</TabsTrigger>
                <TabsTrigger value="warm" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">🌡️ Warm ({warmLeads.length})</TabsTrigger>
                <TabsTrigger value="cold" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">❄️ Cold ({coldLeads.length})</TabsTrigger>
                <TabsTrigger value="booked" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  ✅ Booked ({bookedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="lost" className="data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">❌ Lost ({lostLeads.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="hot">
                <LeadList leads={hotLeads} type="hot" />
              </TabsContent>

              <TabsContent value="warm">
                <LeadList leads={warmLeads} type="warm" />
              </TabsContent>

              <TabsContent value="cold">
                <LeadList leads={coldLeads} type="cold" />
              </TabsContent>

              <TabsContent value="booked">
                <LeadList leads={bookedLeads} type="booked" />
              </TabsContent>

              <TabsContent value="lost">
                <LeadList leads={lostLeads} type="lost" />
              </TabsContent>
            </Tabs>
          </CardShell>
        </div>
      </div>
    </div>
  )
}

