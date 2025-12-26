'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Phone, Mail, Navigation } from 'lucide-react'
import Link from 'next/link'

type Assignment = {
  id: string
  clocked_in_at: string | null
  clocked_out_at: string | null
  job: {
    id: string
    title: string
    description: string | null
    service_type: string | null
    scheduled_date: string | null
    estimated_duration: number | null
    estimated_cost: number | null
    status: string
    client: {
      name: string
      phone: string | null
      email: string | null
      address: string | null
    }
  }
}

export default function WorkerJobList({ assignments }: { assignments: Assignment[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
    }
  }

  function getGoogleMapsUrl(address: string | null) {
    if (!address) return null
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const job = assignment.job
        const client = job.client
        const mapsUrl = getGoogleMapsUrl(client.address)

        return (
          <Card key={assignment.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Link href={`/worker/jobs/${job.id}`}>
                  <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                </Link>
                {job.service_type && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {job.service_type}
                  </p>
                )}
              </div>
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Job Details */}
            <div className="space-y-3 mb-4">
              {job.scheduled_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>
                    {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {job.estimated_duration && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>~{job.estimated_duration} minutes</span>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="border-t pt-4 mb-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Customer</p>
              <p className="font-semibold mb-2">{client.name}</p>

              <div className="space-y-2">
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </a>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </a>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-4 w-4" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t pt-4">
              <Link href={`/worker/jobs/${job.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>

              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </a>
              )}

              {client.phone && (
                <a href={`tel:${client.phone}`}>
                  <Button variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
