import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardOverview } from '@/components/dashboard/overview'
import { TicketsOverview } from '@/components/dashboard/tickets-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Dashboard - Customer Support System',
  description: 'Customer support dashboard with tickets overview, analytics, and team performance metrics.',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null // This should not happen due to layout protection
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name || 'Agent'}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your support operations for today.
        </p>
      </div>

      {/* Dashboard Overview Stats */}
      <DashboardOverview />

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <TicketsOverview />
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Your support performance over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="response" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="response">Response Time</TabsTrigger>
                  <TabsTrigger value="resolution">Resolution Rate</TabsTrigger>
                  <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
                </TabsList>
                <TabsContent value="response" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Response time analytics will be displayed here
                  </div>
                </TabsContent>
                <TabsContent value="resolution" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Resolution rate analytics will be displayed here
                  </div>
                </TabsContent>
                <TabsContent value="satisfaction" className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Customer satisfaction metrics will be displayed here
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
          
          <Card>
            <CardHeader>
              <CardTitle>Team Status</CardTitle>
              <CardDescription>
                Current availability of team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available (3)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Busy (2)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm">Offline (1)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}