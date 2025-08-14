import { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  MousePointer,
  DollarSign,
  AlertCircle,
  Plus,
  Download,
  Filter,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard | Email Campaign Analytics',
  description: 'Email marketing analytics dashboard with real-time performance insights',
}

// Mock data for demonstration - in real app this would come from API
const mockMetrics = {
  totalCampaigns: 156,
  totalSubscribers: 25847,
  avgOpenRate: 24.3,
  avgClickRate: 3.8,
  totalRevenue: 89420,
  avgEngagementScore: 78
}

const mockRecentCampaigns = [
  {
    id: 1,
    name: 'Black Friday Sale 2024',
    subject: '🔥 50% Off Everything - Black Friday Exclusive',
    sentAt: '2024-01-12T10:00:00Z',
    status: 'sent',
    totalSent: 15420,
    openRate: 28.5,
    clickRate: 5.2,
    revenue: 12450
  },
  {
    id: 2,
    name: 'Weekly Newsletter #47',
    subject: 'Top Email Marketing Trends This Week',
    sentAt: '2024-01-10T09:00:00Z',
    status: 'sent',
    totalSent: 12890,
    openRate: 22.1,
    clickRate: 3.4,
    revenue: 0
  },
  {
    id: 3,
    name: 'Product Launch Announcement',
    subject: 'Introducing Our Revolutionary New Feature',
    sentAt: '2024-01-08T14:30:00Z',
    status: 'sent',
    totalSent: 8950,
    openRate: 31.2,
    clickRate: 7.8,
    revenue: 5600
  }
]

function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  format = 'number' 
}: {
  title: string
  value: number
  change: number
  icon: any
  format?: 'number' | 'percentage' | 'currency'
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`
      case 'currency':
        return `$${val.toLocaleString()}`
      default:
        return val.toLocaleString()
    }
  }

  const isPositive = change > 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <div className={`flex items-center text-xs ${changeColor}`}>
          <ChangeIcon className="h-3 w-3 mr-1" />
          {Math.abs(change)}% from last month
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignRow({ campaign }: { campaign: any }) {
  const statusColor = campaign.status === 'sent' ? 'success' : 'neutral'
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium truncate">{campaign.name}</h4>
          <Badge variant={statusColor}>{campaign.status}</Badge>
        </div>
        <p className="text-xs text-gray-500 truncate">{campaign.subject}</p>
        <p className="text-xs text-gray-400">
          {new Date(campaign.sentAt).toLocaleDateString()} • {campaign.totalSent.toLocaleString()} sent
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium">{campaign.openRate}%</div>
          <div className="text-xs text-gray-400">Open Rate</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{campaign.clickRate}%</div>
          <div className="text-xs text-gray-400">Click Rate</div>
        </div>
        {campaign.revenue > 0 && (
          <div className="text-center">
            <div className="font-medium">${campaign.revenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Revenue</div>
          </div>
        )}
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your email campaign performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <Suspense fallback={<LoadingSkeleton />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Campaigns"
            value={mockMetrics.totalCampaigns}
            change={8.2}
            icon={Mail}
          />
          <MetricCard
            title="Total Subscribers"
            value={mockMetrics.totalSubscribers}
            change={12.5}
            icon={Users}
          />
          <MetricCard
            title="Avg Open Rate"
            value={mockMetrics.avgOpenRate}
            change={-2.1}
            icon={Eye}
            format="percentage"
          />
          <MetricCard
            title="Avg Click Rate"
            value={mockMetrics.avgClickRate}
            change={4.3}
            icon={MousePointer}
            format="percentage"
          />
        </div>
      </Suspense>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${mockMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Total revenue from email campaigns this month
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +18.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {mockMetrics.avgEngagementScore}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Average engagement score across all campaigns
            </div>
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +5.1% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>
                Your latest email campaigns and their performance metrics
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentCampaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base">Connect Email Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Connect your email service provider to start tracking campaigns
            </p>
            <Button size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base">Create Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Generate detailed analytics reports for your campaigns
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base">A/B Test Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Set up A/B tests to optimize your email performance
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}