import { getTeamMembers } from '@/lib/actions/team'
import AddTeamMemberButton from '@/components/team/add-team-member-button'
// TeamMemberList component does not exist yet; create it or use a placeholder
// For now, we'll inline the list rendering to avoid the missing module error
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
            {/* Inline team list rendering until TeamMemberList component is created */}
            <div className="space-y-4">
                {members.map((member) => (
                    <Card key={member.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                <div>
                                    <p className="font-semibold">{member.name}</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{member.email}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                                {member.status}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
