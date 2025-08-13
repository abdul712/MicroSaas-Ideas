import { withPageAuthRequired } from '@auth0/nextjs-auth0'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { HealthScoreCard } from '@/components/dashboard/health-score-card'
import { MetricsGrid } from '@/components/dashboard/metrics-grid'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

async function DashboardPage() {
  // In a real app, these would be fetched from your API
  const mockData = {
    healthScore: {
      overall: 78,
      financial: 82,
      customer: 75,
      operations: 80,
      growth: 71,
      marketing: 76
    },
    metrics: {
      revenue: { value: 145000, change: 12.5, period: 'This Month' },
      expenses: { value: 89000, change: -3.2, period: 'This Month' },
      cashFlow: { value: 56000, change: 8.7, period: 'This Month' },
      customers: { value: 1247, change: 5.3, period: 'Active' },
      conversionRate: { value: 3.2, change: 0.4, period: 'This Month' },
      churnRate: { value: 2.1, change: -0.3, period: 'This Month' }
    },
    alerts: [
      {
        id: '1',
        type: 'warning',
        title: 'High expense spike detected',
        description: 'Marketing expenses increased by 45% this week',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        severity: 'warning' as const
      },
      {
        id: '2', 
        type: 'info',
        title: 'Monthly revenue goal achieved',
        description: 'You\'ve reached 102% of your monthly revenue target',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        severity: 'info' as const
      },
      {
        id: '3',
        type: 'critical',
        title: 'Cash flow warning',
        description: 'Cash flow projected to turn negative in 2 weeks',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        severity: 'critical' as const
      }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'integration',
        message: 'QuickBooks data synchronized',
        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        id: '2',
        type: 'metric',
        message: 'Revenue milestone of $145K reached',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '3',
        type: 'alert',
        message: 'New high-priority alert created',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Health Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your business vital signs in real-time</p>
          </div>
          <QuickActions />
        </div>

        {/* Health Score Section */}
        <HealthScoreCard healthScore={mockData.healthScore} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Grid - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <MetricsGrid metrics={mockData.metrics} />
          </div>

          {/* Side Panel - Alerts and Activity */}
          <div className="space-y-6">
            <AlertsPanel alerts={mockData.alerts} />
            <RecentActivity activities={mockData.recentActivity} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withPageAuthRequired(DashboardPage)