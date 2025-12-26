import { getTeamMembers } from '@/lib/actions/team'
import AddTeamMemberButton from '@/components/team/add-team-member-button'
import TeamMemberList from '@/components/team/team-member-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Award, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
    const members = await getTeamMembers()

    const activeMembers = members.filter(m => m.status === 'active')
    // Note: These fields (total_jobs_completed, total_earnings, average_rating) 
    // need to be calculated or added to the database schema/query later.
    // For now, we'll default them to 0 if they don't exist on the type.
    const totalJobsCompleted = members.reduce((sum, m) => sum + (m.total_jobs_completed || 0), 0)
    const totalEarnings = members.reduce((sum, m) => sum + (m.total_earnings || 0), 0)
    const avgRating = members.length > 0
        ? members.reduce((sum, m) => sum + (m.average_rating || 0), 0) / members.length
        : 0

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your team members and assignments
                    </p>
                </div>
                <AddTeamMemberButton />
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Team Members
                        </CardTitle>
                        <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeMembers.length}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            {members.length - activeMembers.length} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Jobs Completed
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalJobsCompleted}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Total Earnings
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">
                            ${totalEarnings.toFixed(2)}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            Team total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Avg Rating
                        </CardTitle>
                        <Award className="h-5 w-5 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            ⭐ Team average
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Team List */}
            <TeamMemberList members={members.map(m => ({
                ...m,
                user_id: m.user_id || null,
                total_jobs_completed: (m as any).total_jobs_completed || 0,
                average_rating: (m as any).average_rating || 0,
                total_earnings: (m as any).total_earnings || 0,
            }))} />
        </div>
    )
}
