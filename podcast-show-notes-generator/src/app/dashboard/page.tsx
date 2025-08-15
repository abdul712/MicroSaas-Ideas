import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { RecentEpisodes } from '@/components/dashboard/recent-episodes'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { UsageStats } from '@/components/dashboard/usage-stats'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      podcasts: {
        include: {
          episodes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              transcription: true,
              showNotes: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Calculate statistics
  const totalEpisodes = user.podcasts.reduce((sum, podcast) => sum + podcast.episodes.length, 0)
  const completedEpisodes = user.podcasts.reduce(
    (sum, podcast) => sum + podcast.episodes.filter(ep => ep.processingStatus === 'COMPLETED').length, 
    0
  )
  const processingEpisodes = user.podcasts.reduce(
    (sum, podcast) => sum + podcast.episodes.filter(ep => ep.processingStatus === 'PROCESSING').length, 
    0
  )

  const stats = {
    totalEpisodes,
    completedEpisodes,
    processingEpisodes,
    creditsUsed: user.creditsUsed,
    monthlyCredits: user.monthlyCredits,
    subscriptionPlan: user.subscriptionPlan
  }

  const allEpisodes = user.podcasts.flatMap(podcast => 
    podcast.episodes.map(episode => ({
      ...episode,
      podcastName: podcast.name
    }))
  ).slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {user.name || 'User'}! Here's what's happening with your podcasts.
        </p>
      </div>

      {/* Overview stats */}
      <DashboardOverview stats={stats} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <QuickActions />

          {/* Recent episodes */}
          <RecentEpisodes episodes={allEpisodes} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage stats */}
          <UsageStats 
            creditsUsed={user.creditsUsed}
            monthlyCredits={user.monthlyCredits}
            subscriptionPlan={user.subscriptionPlan}
          />
        </div>
      </div>
    </div>
  )
}