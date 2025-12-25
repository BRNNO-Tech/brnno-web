import { getJob } from '@/lib/actions/jobs'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AssignJobDialog from '@/components/jobs/assign-job-dialog'
import { Calendar, Clock, DollarSign, MapPin, User, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const job = await getJob(id)

    if (!job) notFound()

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <Badge variant={
                job.status === 'completed' ? 'default' :
                job.status === 'in_progress' ? 'secondary' :
                job.status === 'cancelled' ? 'destructive' :
                'outline'
              }>
                {job.status.replace('_', ' ')}
              </Badge>
              <Badge variant={
                job.priority === 'urgent' ? 'destructive' :
                job.priority === 'high' ? 'secondary' :
                'outline'
              }>
                {job.priority}
              </Badge>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Job ID: {job.id}
            </p>
          </div>
          <div className="flex gap-2">
            <AssignJobDialog
              jobId={job.id}
              currentAssignment={
                job.assignments?.[0]?.team_member
                  ? {
                      id: job.assignments[0].team_member.id,
                      name: job.assignments[0].team_member.name
                    }
                  : null
              }
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">Scheduled Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <span>{job.scheduled_date ? new Date(job.scheduled_date).toLocaleString() : 'Not scheduled'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">Service Type</p>
                    <p>{job.service_type || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">Estimated Duration</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span>{job.estimated_duration ? `${job.estimated_duration} mins` : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-500">Estimated Cost</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-zinc-400" />
                      <span>{job.estimated_cost ? `$${job.estimated_cost.toFixed(2)}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <p className="text-sm font-medium text-zinc-500">Description</p>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {job.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    {job.address ? (
                      <>
                        <p>{job.address}</p>
                        <p>{job.city}, {job.state} {job.zip}</p>
                        {job.is_mobile_service && (
                          <Badge variant="secondary" className="mt-2">Mobile Service</Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-zinc-500">No address provided</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <p className="text-sm font-medium text-zinc-500">Client Notes</p>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap pl-6">
                        {job.client_notes || 'None'}
                    </p>
                </div>
                <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" />
                        <p className="text-sm font-medium text-zinc-500">Internal Notes</p>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap pl-6">
                        {job.internal_notes || 'None'}
                    </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.client ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-medium">{job.client.name}</p>
                        <p className="text-sm text-zinc-500">Client</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {job.client.email && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Email:</span>
                          <a href={`mailto:${job.client.email}`} className="text-blue-600 hover:underline">
                            {job.client.email}
                          </a>
                        </div>
                      )}
                      {job.client.phone && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Phone:</span>
                          <a href={`tel:${job.client.phone}`} className="text-blue-600 hover:underline">
                            {job.client.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500">No client associated</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {job.assignments && job.assignments.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                        {job.assignments[0].team_member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{job.assignments[0].team_member.name}</p>
                        <Badge variant="secondary" className="mt-1">
                          {job.assignments[0].team_member.role}
                        </Badge>
                      </div>
                    </div>
                    <AssignJobDialog
                        jobId={job.id}
                        currentAssignment={{
                            id: job.assignments[0].team_member.id,
                            name: job.assignments[0].team_member.name
                        }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-zinc-500 mb-4">No team member assigned</p>
                    <AssignJobDialog jobId={job.id} currentAssignment={null} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
