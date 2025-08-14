import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Activity,
  Plus,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - in a real app this would come from API/database
  const stats = {
    totalCustomers: 12847,
    totalSegments: 18,
    activeIntegrations: 5,
    conversionRate: 3.2,
    customerGrowth: 12.5,
    segmentGrowth: 8.3,
    revenueGrowth: 18.7,
    churnRate: 2.1,
  };

  const recentSegments = [
    {
      id: '1',
      name: 'High-Value Customers',
      customerCount: 1247,
      color: '#10B981',
      growthRate: 5.2,
      lastUpdated: '2 hours ago',
    },
    {
      id: '2',
      name: 'At-Risk Customers',
      customerCount: 342,
      color: '#EF4444',
      growthRate: -3.1,
      lastUpdated: '4 hours ago',
    },
    {
      id: '3',
      name: 'New Customers',
      customerCount: 567,
      color: '#3B82F6',
      growthRate: 15.8,
      lastUpdated: '6 hours ago',
    },
    {
      id: '4',
      name: 'Loyal Customers',
      customerCount: 892,
      color: '#F59E0B',
      growthRate: 2.4,
      lastUpdated: '1 day ago',
    },
  ];

  const integrations = [
    { name: 'Shopify', status: 'connected', lastSync: '2 hours ago', customers: 8420 },
    { name: 'Stripe', status: 'connected', lastSync: '1 hour ago', customers: 6235 },
    { name: 'Mailchimp', status: 'connected', lastSync: '3 hours ago', customers: 9841 },
    { name: 'HubSpot', status: 'syncing', lastSync: 'In progress', customers: 3567 },
    { name: 'Google Analytics', status: 'error', lastSync: '2 days ago', customers: 0 },
  ];

  const recentActivity = [
    {
      type: 'segment_update',
      message: 'High-Value Customers segment updated with 23 new members',
      timestamp: '5 minutes ago',
      icon: Target,
    },
    {
      type: 'integration_sync',
      message: 'Shopify integration synced successfully',
      timestamp: '1 hour ago',
      icon: CheckCircle,
    },
    {
      type: 'ml_discovery',
      message: 'AI discovered new behavioral pattern in customer data',
      timestamp: '2 hours ago',
      icon: Zap,
    },
    {
      type: 'campaign_launch',
      message: 'Email campaign launched to At-Risk Customers segment',
      timestamp: '4 hours ago',
      icon: Activity,
    },
  ];

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your customer segmentation and analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.customerGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSegments}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.segmentGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.revenueGrowth}%</span> revenue growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-0.3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Segments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Segments</CardTitle>
            <CardDescription>
              Your most recently updated customer segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSegments.map((segment) => (
                <div key={segment.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div>
                      <p className="font-medium">{segment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {segment.customerCount.toLocaleString()} customers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {segment.growthRate > 0 ? '+' : ''}{segment.growthRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {segment.lastUpdated}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Segments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Status of your data connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      integration.status === 'connected' ? 'bg-green-500' :
                      integration.status === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">{integration.name}</span>
                  </div>
                  <Badge variant={
                    integration.status === 'connected' ? 'default' :
                    integration.status === 'syncing' ? 'secondary' : 'destructive'
                  }>
                    {integration.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes in your customer segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  <activity.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Create Segment</p>
                <p className="text-sm text-muted-foreground">Build new customer groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Run ML Analysis</p>
                <p className="text-sm text-muted-foreground">Discover new patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">View Analytics</p>
                <p className="text-sm text-muted-foreground">Deep dive into data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Launch Campaign</p>
                <p className="text-sm text-muted-foreground">Target your segments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}