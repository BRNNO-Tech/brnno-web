'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Phone,
  Trash2,
  UserPlus,
  MessageSquare,
  Eye,
  DollarSign,
} from 'lucide-react'
import {
  deleteLead,
  updateLeadStatus,
  convertLeadToClient,
} from '@/lib/actions/leads'
import Link from 'next/link'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  booking_progress: number
  score: string
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  interested_service?: {
    name: string
    price: number
  } | null
}

export default function LeadList({
  leads,
  type,
}: {
  leads: Lead[]
  type: 'hot' | 'warm' | 'cold' | 'converted' | 'lost'
}) {
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      await deleteLead(id)
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    }
  }

  async function handleStatusChange(
    id: string,
    status: 'new' | 'contacted' | 'quoted' | 'nurturing' | 'converted' | 'lost'
  ) {
    try {
      await updateLeadStatus(id, status)
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead')
    }
  }

  async function handleConvert(id: string) {
    if (!confirm('Convert this lead to a client?')) return

    try {
      await convertLeadToClient(id)
      alert('Lead converted to client!')
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Failed to convert lead')
    }
  }

  if (leads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No {type} leads yet.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const timeSinceCreated = Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) /
          (1000 * 60 * 60)
        )
        const urgency = lead.score === 'hot' && timeSinceCreated < 2

        return (
          <Card
            key={lead.id}
            className={`p-6 ${urgency ? 'border-2 border-red-500' : ''}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{lead.name}</h3>
                  {urgency && (
                    <span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">
                      URGENT
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    lead.score === 'hot'
                      ? 'destructive'
                      : lead.score === 'warm'
                        ? 'default'
                        : 'outline'
                  }
                >
                  {lead.score}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Link href={`/dashboard/leads/${lead.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(lead.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-xs hover:underline"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.interested_in_service_name && (
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Interested in: {lead.interested_in_service_name}
                </p>
              )}
              {lead.estimated_value && (
                <div className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span>${Number(lead.estimated_value).toFixed(2)}</span>
                </div>
              )}
              {lead.booking_progress > 0 && (
                <div>
                  <p className="mb-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Booking progress: {lead.booking_progress}%
                  </p>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-1.5 rounded-full bg-blue-600"
                      style={{ width: `${lead.booking_progress}%` }}
                    />
                  </div>
                </div>
              )}
              {lead.source && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Source: {lead.source}
                </p>
              )}
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Created{' '}
                {timeSinceCreated < 1
                  ? 'less than an hour ago'
                  : `${timeSinceCreated} hours ago`}
              </p>
              {lead.last_contacted_at && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Last contact:{' '}
                  {new Date(lead.last_contacted_at).toLocaleString()}
                  {lead.follow_up_count > 0 &&
                    ` (${lead.follow_up_count} attempts)`}
                </p>
              )}
            </div>

            {type !== 'converted' && type !== 'lost' && (
              <div className="flex flex-wrap gap-2">
                {lead.status === 'new' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleStatusChange(lead.id, 'contacted')}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Contacted
                  </Button>
                )}
                {lead.status === 'contacted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleStatusChange(lead.id, 'quoted')}
                  >
                    Quoted
                  </Button>
                )}
                {(lead.status === 'quoted' ||
                  lead.status === 'contacted' ||
                  lead.status === 'nurturing') && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleConvert(lead.id)}
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      Convert
                    </Button>
                  )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange(lead.id, 'lost')}
                >
                  Lost
                </Button>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

