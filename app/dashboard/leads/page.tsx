import { getLeads } from '@/lib/actions/leads'
import AddLeadButton from '@/components/leads/add-lead-button'
import LeadList from '@/components/leads/lead-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const allLeads = await getLeads('all')

  const hotLeads = allLeads.filter(
    (l: any) => l.score === 'hot' && l.status !== 'converted' && l.status !== 'lost'
  )
  const warmLeads = allLeads.filter(
    (l: any) => l.score === 'warm' && l.status !== 'converted' && l.status !== 'lost'
  )
  const coldLeads = allLeads.filter(
    (l: any) => l.score === 'cold' && l.status !== 'converted' && l.status !== 'lost'
  )
  const convertedLeads = allLeads.filter((l: any) => l.status === 'converted')
  const lostLeads = allLeads.filter((l: any) => l.status === 'lost')
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Recovery</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Track and convert potential customers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads/sequences">
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Automated Sequences
            </Button>
          </Link>
          <Link href="/dashboard/leads/analytics">
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </Link>
        <AddLeadButton />
      </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Hot Leads
            </p>
          </div>
          <p className="text-3xl font-bold">{hotLeads.length}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Need immediate follow-up
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Warm Leads
            </p>
          </div>
          <p className="text-3xl font-bold">{warmLeads.length}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Active opportunities
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Cold Leads
            </p>
          </div>
          <p className="text-3xl font-bold">{coldLeads.length}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Need re-engagement
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Converted
            </p>
          </div>
          <p className="text-3xl font-bold">{convertedLeads.length}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            This month
          </p>
        </div>
      </div>

      <Tabs defaultValue="hot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hot">🔥 Hot ({hotLeads.length})</TabsTrigger>
          <TabsTrigger value="warm">🌡️ Warm ({warmLeads.length})</TabsTrigger>
          <TabsTrigger value="cold">❄️ Cold ({coldLeads.length})</TabsTrigger>
          <TabsTrigger value="converted">
            ✅ Converted ({convertedLeads.length})
          </TabsTrigger>
          <TabsTrigger value="lost">❌ Lost ({lostLeads.length})</TabsTrigger>
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

        <TabsContent value="converted">
          <LeadList leads={convertedLeads} type="converted" />
        </TabsContent>

        <TabsContent value="lost">
          <LeadList leads={lostLeads} type="lost" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

