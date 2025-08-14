import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentPortals } from '@/components/dashboard/recent-portals'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { UsageOverview } from '@/components/dashboard/usage-overview'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch dashboard data
  const [account, portals, clients, stats] = await Promise.all([
    prisma.account.findUnique({
      where: { id: session.user.accountId },
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            portals: true,
            clients: true
          }
        }
      }
    }),
    prisma.portal.findMany({
      where: { accountId: session.user.accountId },
      include: {
        client: true,
        owner: true,
        _count: {
          select: {
            files: true,
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    }),
    prisma.client.findMany({
      where: { accountId: session.user.accountId },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.activity.groupBy({
      by: ['type'],
      where: {
        portal: {
          accountId: session.user.accountId
        },
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      },
      _count: {
        id: true
      }
    })
  ])

  if (!account) {
    redirect('/onboarding')
  }

  const dashboardData = {
    account,
    portals,
    clients,
    stats: {
      totalPortals: account._count.portals,
      activeClients: account._count.clients,
      totalFiles: portals.reduce((sum, portal) => sum + portal._count.files, 0),
      storageUsed: account.subscription?.storageUsed || 0,
      messagesThisMonth: stats.find(s => s.type === 'MESSAGE_SENT')?._count.id || 0,
      portalViews: stats.find(s => s.type === 'PORTAL_ACCESS')?._count.id || 0
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your portals.
            </p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats stats={dashboardData.stats} />

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>

          {/* Recent Portals */}
          <div className="lg:col-span-2">
            <RecentPortals portals={dashboardData.portals} />
          </div>
        </div>

        {/* Usage Overview */}
        <UsageOverview 
          subscription={account.subscription}
          plan={account.plan}
        />
      </div>
    </DashboardLayout>
  )
}