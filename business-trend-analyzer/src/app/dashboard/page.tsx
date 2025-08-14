import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { InsightsFeed } from '@/components/dashboard/insights-feed'
import { TrendCharts } from '@/components/dashboard/trend-charts'
import { QuickActions } from '@/components/dashboard/quick-actions'

export const metadata: Metadata = {
  title: 'Dashboard - Business Trend Analyzer',
  description: 'Monitor your business trends and insights in real-time',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your business.
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Overview Section */}
        <DashboardOverview />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trends and Charts */}
          <div className="lg:col-span-2">
            <TrendCharts />
          </div>

          {/* Insights Feed */}
          <div className="lg:col-span-1">
            <InsightsFeed />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}