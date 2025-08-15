import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardOverview } from '@/components/dashboard/overview'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

async function getDashboardData(userId: string) {
  const [sites, memberships, totalRevenue] = await Promise.all([
    prisma.membershipSite.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            memberships: true,
            content: true,
          },
        },
      },
    }),
    prisma.membership.count({
      where: {
        site: {
          ownerId: userId,
        },
        status: 'ACTIVE',
      },
    }),
    prisma.payment.aggregate({
      where: {
        user: {
          sites: {
            some: {
              ownerId: userId,
            },
          },
        },
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    }),
  ])

  return {
    sites,
    totalMembers: memberships,
    totalRevenue: totalRevenue._sum.amount || 0,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return <div>Loading...</div>
  }

  const dashboardData = await getDashboardData(session.user.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats 
          totalSites={dashboardData.sites.length}
          totalMembers={dashboardData.totalMembers}
          totalRevenue={dashboardData.totalRevenue}
        />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <DashboardOverview sites={dashboardData.sites} />
        </div>
        <div className="col-span-3 space-y-4">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}