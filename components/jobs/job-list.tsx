'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Edit,
  MapPin,
  Car,
  DollarSign,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import { deleteJob, updateJobStatus } from '@/lib/actions/jobs'
import EditJobSheet from './edit-job-dialog'
import AssignJobDialog from './assign-job-dialog'
import { useState } from 'react'
import Link from 'next/link'

type Job = {
  id: string
  title: string
  description: string | null
  service_type: string | null
  scheduled_date: string | null
  estimated_cost: number | null
  estimated_duration: number | null
  status: string
  priority: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  is_mobile_service: boolean
  client_notes: string | null
  internal_notes: string | null
  client_id: string | null
  client: { name: string; phone?: string } | null
  assignments?: {
    id: string
    team_member: {
      id: string
      name: string
      role: string
    }
  }[]
  asset_details?: Record<string, any> | null
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-700 dark:text-green-300'
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-700 dark:text-blue-300'
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-700 dark:text-red-300'
      }
    default:
      return {
        label: 'Scheduled',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-300'
      }
  }
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await deleteJob(id)
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }

  async function handleStatusChange(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    try {
      await updateJobStatus(id, status)
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job')
    }
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Car className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          No jobs found
        </p>
      </Card>
    )
  }

  // Group jobs by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayJobs = jobs.filter(j => {
    if (!j.scheduled_date) return false
    const jobDate = new Date(j.scheduled_date)
    jobDate.setHours(0, 0, 0, 0)
    return jobDate.getTime() === today.getTime()
  })

  const upcomingJobs = jobs.filter(j => {
    if (!j.scheduled_date) return false
    const jobDate = new Date(j.scheduled_date)
    jobDate.setHours(0, 0, 0, 0)
    return jobDate.getTime() > today.getTime()
  })

  const pastJobs = jobs.filter(j => {
    if (!j.scheduled_date) return true // Unscheduled
    const jobDate = new Date(j.scheduled_date)
    jobDate.setHours(0, 0, 0, 0)
    return jobDate.getTime() < today.getTime()
  })

  return (
    <>
      <div className="space-y-8">
        {/* Today's Jobs */}
        {todayJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today ({todayJobs.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {todayJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={setEditingJob}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              Upcoming ({upcomingJobs.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={setEditingJob}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past/Unscheduled Jobs */}
        {pastJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
              <Clock className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              Past & Unscheduled ({pastJobs.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pastJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={setEditingJob}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {editingJob && (
        <EditJobSheet
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
        />
      )}
    </>
  )
}

function JobCard({
  job,
  onEdit,
  onDelete,
  onStatusChange
}: {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: any) => void
}) {
  const statusConfig = getStatusConfig(job.status)

  return (
    <Link href={`/dashboard/jobs/${job.id}`}>
      <Card className={`p-4 transition-all hover:shadow-lg cursor-pointer border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
              <span className={`text-xs font-semibold uppercase ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
              {job.title}
            </h3>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
            {job.status === 'scheduled' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(job.id, 'in_progress')
                }}
              >
                <Play className="h-4 w-4 text-blue-600" />
              </Button>
            )}

            {job.status === 'in_progress' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(job.id, 'completed')
                }}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onEdit(job)
              }}
            >
              <Edit className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onDelete(job.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Customer Info */}
        {job.client && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
              {job.client.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">
                {job.client.name}
              </p>
              {job.client.phone && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {job.client.phone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Vehicle/Asset Details */}
        {job.asset_details && Object.keys(job.asset_details).length > 0 && (
          <div className="flex items-start gap-2 mb-3 text-sm">
            <Car className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
            <p className="text-zinc-700 dark:text-zinc-300">
              {Object.entries(job.asset_details)
                .map(([key, value]) => value)
                .join(' • ')}
            </p>
          </div>
        )}

        {/* Date & Time */}
        {job.scheduled_date && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-zinc-700 dark:text-zinc-300">
              {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {/* Location */}
        {job.city && job.state && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <MapPin className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-zinc-700 dark:text-zinc-300">
              {job.city}, {job.state}
            </span>
          </div>
        )}

        {/* Price & Duration */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            {job.estimated_cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">
                  ${job.estimated_cost.toFixed(2)}
                </span>
              </div>
            )}

            {job.estimated_duration && (
              <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{job.estimated_duration} min</span>
              </div>
            )}
          </div>

          {/* Assigned Worker */}
          {job.assignments && job.assignments.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {job.assignments[0].team_member.name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
