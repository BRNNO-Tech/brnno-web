'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LeadsList } from './leads-list'
import { LeadSlideOut } from './lead-slide-out'
import { markLeadAsRead } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_id: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  notes: string | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  viewed_at: string | null
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
}

interface LeadsInboxLayoutProps {
  leads: Lead[]
}

export function LeadsInboxLayout({ leads }: LeadsInboxLayoutProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [leadsList, setLeadsList] = useState(leads)
  const router = useRouter()
  const processedLeadsRef = useRef<Set<string>>(new Set())
  const selectedLead = selectedLeadId ? leadsList.find(l => l.id === selectedLeadId) : null

  // Update leads list when props change
  // Filter out fully booked leads from default inbox view
  // (leads with status 'booked' or job_id - these are fully completed bookings)
  useEffect(() => {
    const filteredLeads = leads.filter((lead: any) => {
      // Exclude leads that are fully booked (have status 'booked' or have a job_id)
      return lead.status !== 'booked' && !lead.job_id
    })
    setLeadsList(filteredLeads)
  }, [leads])

  // Mark lead as read when selected
  useEffect(() => {
    if (!selectedLeadId) return
    
    // Skip if we've already processed this lead
    if (processedLeadsRef.current.has(selectedLeadId)) return
    
    const lead = leadsList.find(l => l.id === selectedLeadId)
    if (!lead || lead.viewed_at) {
      processedLeadsRef.current.add(selectedLeadId)
      return
    }
    
    // Mark this lead as being processed
    processedLeadsRef.current.add(selectedLeadId)
    
    // Mark as read
    markLeadAsRead(selectedLeadId).then(() => {
      // Update local state
      setLeadsList(prev => prev.map(l => 
        l.id === selectedLeadId 
          ? { ...l, viewed_at: new Date().toISOString() }
          : l
      ))
      // Refresh the page data
      router.refresh()
    }).catch(error => {
      console.error('Error marking lead as read:', error)
      // Remove from processed set on error so we can retry
      processedLeadsRef.current.delete(selectedLeadId)
    })
  }, [selectedLeadId, router])

  const handleLeadDeleted = (deletedLeadId: string) => {
    // Remove deleted lead from list
    setLeadsList(prev => prev.filter(l => l.id !== deletedLeadId))
    // Clear selection if deleted lead was selected
    if (selectedLeadId === deletedLeadId) {
      setSelectedLeadId(null)
    }
    router.refresh()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Column: List of leads */}
      <div className="w-80 flex-shrink-0 border-r border-zinc-200/50 dark:border-white/10 overflow-y-auto">
        <LeadsList
          leads={leadsList}
          selectedLeadId={selectedLeadId}
          onSelectLead={setSelectedLeadId}
        />
      </div>

      {/* Middle Column: Empty or stats (for future use) */}
      <div className="flex-1 hidden lg:block" />

      {/* Right Column: Slide-out */}
      <div className={cn(
        "hidden xl:block w-96 flex-shrink-0 border-l border-zinc-200/50 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out",
        selectedLead 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full pointer-events-none w-0"
      )}>
        {selectedLead && (
          <LeadSlideOut
            lead={selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onDelete={handleLeadDeleted}
          />
        )}
      </div>

      {/* Mobile: Slide-out as Modal/Drawer */}
      {selectedLead && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl animate-in slide-in-from-right duration-300">
            <LeadSlideOut
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
              onDelete={handleLeadDeleted}
            />
          </div>
        </div>
      )}
    </div>
  )
}
