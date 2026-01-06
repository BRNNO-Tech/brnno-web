'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react'
import { getScheduledJobs, getTimeBlocks, createTimeBlock, deleteTimeBlock, updateJobDate } from '@/lib/actions/schedule'
import AddTimeBlockDialog from './add-time-block-dialog'

type Job = {
  id: string
  title: string
  scheduled_date: string | null
  estimated_duration: number | null
  estimated_cost: number | null
  status: string
  client: { name: string } | null
}

type TimeBlock = {
  id: string
  title: string
  start_time: string
  end_time: string
  type: 'personal' | 'holiday' | 'unavailable'
  description: string | null
}

export default function ScheduleCalendar({
  initialJobs,
  initialTimeBlocks
}: {
  initialJobs: Job[]
  initialTimeBlocks: TimeBlock[]
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generate calendar days
  const calendarDays: (Date | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  // Get events for a specific date
  function getEventsForDate(date: Date | null): { jobs: Job[]; timeBlocks: TimeBlock[] } {
    if (!date) return { jobs: [], timeBlocks: [] }

    const dateStr = date.toISOString().split('T')[0]

    const dayJobs = jobs.filter(job => {
      if (!job.scheduled_date) return false
      const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
      return jobDate === dateStr
    })

    const dayTimeBlocks = timeBlocks.filter(block => {
      const blockStart = new Date(block.start_time).toISOString().split('T')[0]
      const blockEnd = new Date(block.end_time).toISOString().split('T')[0]
      return dateStr >= blockStart && dateStr <= blockEnd
    })

    return { jobs: dayJobs, timeBlocks: dayTimeBlocks }
  }

  // Format time from datetime string
  // The datetime comes from the database as an ISO string (UTC)
  // We need to display it in the user's local timezone
  function formatTime(datetime: string): string {
    if (!datetime) return ''
    
    try {
      const date = new Date(datetime)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', datetime)
        return ''
      }
      
      // Format in user's local timezone (toLocaleTimeString uses local timezone by default)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.error('Error formatting time:', error, datetime)
      return ''
    }
  }

  // Navigate months
  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  // Reload data when month changes
  useEffect(() => {
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    async function loadData() {
      try {
        const [newJobs, newTimeBlocks] = await Promise.all([
          getScheduledJobs(startOfMonth.toISOString(), endOfMonth.toISOString()),
          getTimeBlocks(startOfMonth.toISOString(), endOfMonth.toISOString())
        ])
        setJobs(newJobs)
        setTimeBlocks(newTimeBlocks)
      } catch (error) {
        console.error('Error loading schedule data:', error)
      }
    }

    loadData()
  }, [year, month])

  // Handle time block creation
  async function handleAddTimeBlock(data: {
    title: string
    start_time: string
    end_time: string
    type: 'personal' | 'holiday' | 'unavailable'
    description?: string | null
  }) {
    try {
      const newBlock = await createTimeBlock(data)
      setTimeBlocks([...timeBlocks, newBlock])
      setShowAddDialog(false)
    } catch (error) {
      console.error('Error creating time block:', error)
      alert('Failed to create time block')
    }
  }

  // Handle time block deletion
  async function handleDeleteTimeBlock(id: string) {
    if (!confirm('Are you sure you want to delete this time block?')) return

    try {
      await deleteTimeBlock(id)
      setTimeBlocks(timeBlocks.filter(block => block.id !== id))
    } catch (error) {
      console.error('Error deleting time block:', error)
      alert('Failed to delete time block')
    }
  }

  // Handle drag and drop for jobs
  function handleDragStart(e: React.DragEvent, job: Job) {
    setDraggedJob(job)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e: React.DragEvent, targetDate: Date | null) {
    e.preventDefault()
    if (!draggedJob || !targetDate) {
      setDraggedJob(null)
      return
    }

    // Preserve the time from the original scheduled date, or use a default time
    let newDateTime = new Date(targetDate)
    if (draggedJob.scheduled_date) {
      const originalDate = new Date(draggedJob.scheduled_date)
      newDateTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0)
    } else {
      // Default to 9 AM if no time was set
      newDateTime.setHours(9, 0, 0, 0)
    }

    try {
      await updateJobDate(draggedJob.id, newDateTime.toISOString())

      // Update local state
      setJobs(jobs.map(job =>
        job.id === draggedJob.id
          ? { ...job, scheduled_date: newDateTime.toISOString() }
          : job
      ))
    } catch (error) {
      console.error('Error updating job date:', error)
      alert('Failed to move job')
    }

    setDraggedJob(null)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white dark:bg-zinc-900 p-1">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
            >
              Daily
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
            >
              Weekly
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              Monthly
            </Button>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Block Time
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="border-r p-3 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const events = getEventsForDate(date)
                const isCurrentMonth = date !== null
                const isCurrentDay = date && isToday(date)

                // Check for holidays
                const holidays = events.timeBlocks.filter(b => b.type === 'holiday')
                const holidayLabel = holidays.length > 0 ? holidays[0].title : null

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b p-2 last:border-r-0 ${!isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-950' : ''
                      } ${draggedJob ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                  >
                    {date && (
                      <>
                        <div className="mb-1 flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${isCurrentDay
                              ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                              : 'text-zinc-900 dark:text-zinc-50'
                              }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                        {holidayLabel && (
                          <div className="mb-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            {holidayLabel}
                          </div>
                        )}
                        <div className="space-y-1">
                          {/* Time Blocks */}
                          {events.timeBlocks
                            .filter(b => b.type !== 'holiday')
                            .map(block => (
                              <div
                                key={block.id}
                                className={`group relative rounded px-2 py-1 text-xs ${block.type === 'personal'
                                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                  : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                                  }`}
                                title={block.description || block.title}
                              >
                                <button
                                  onClick={() => handleDeleteTimeBlock(block.id)}
                                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 group-hover:flex"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="truncate">
                                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                  </span>
                                </div>
                                <div className="truncate font-medium">{block.title}</div>
                              </div>
                            ))}
                          {/* Jobs */}
                          {events.jobs.map(job => (
                            <div
                              key={job.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, job)}
                              className="cursor-move rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 px-2 py-1 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-800 dark:text-blue-200">
                                  {job.scheduled_date ? formatTime(job.scheduled_date) : ''}
                                </span>
                                {job.estimated_cost && (
                                  <span className="ml-auto font-semibold text-blue-800 dark:text-blue-200">
                                    ${job.estimated_cost.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="truncate font-medium text-blue-900 dark:text-blue-100">
                                {job.title}
                              </div>
                              {job.client && (
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                  {job.client.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Time Block Dialog */}
      {showAddDialog && (
        <AddTimeBlockDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleAddTimeBlock}
        />
      )}
    </div>
  )
}
