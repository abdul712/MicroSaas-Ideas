'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Mail,
  MousePointer,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'

// Mock data - in production, this would come from your API
const mockDashboardData = {
  overview: {
    totalCustomers: 24567,
    activeCustomers: 18934,
    totalSegments: 12,
    activeSegments: 9,
    totalRevenue: 1234567.89,
    avgOrderValue: 89.45,
    conversionRate: 0.032,
    churnRate: 0.045
  },
  recentActivity: [
    { id: 1, type: 'segment_created', description: 'New segment "High Value Customers" created', time: '2 minutes ago' },
    { id: 2, type: 'customer_added', description: '25 customers added to "VIP Members"', time: '15 minutes ago' },
    { id: 3, type: 'campaign_sent', description: 'Email campaign sent to "Recent Buyers" (1,234 recipients)', time: '1 hour ago' },
    { id: 4, type: 'integration_sync', description: 'Shopify integration synced 156 orders', time: '2 hours ago' },
  ],
  topSegments: [
    { id: 1, name: 'High Value Customers', customers: 1234, revenue: 456789, growth: 12.5, color: '#3B82F6' },
    { id: 2, name: 'Loyal Customers', customers: 2567, revenue: 234567, growth: 8.3, color: '#10B981' },
    { id: 3, name: 'At Risk', customers: 567, revenue: 89012, growth: -5.2, color: '#F59E0B' },
    { id: 4, name: 'New Customers', customers: 890, revenue: 123456, growth: 15.7, color: '#8B5CF6' },
  ],
  performanceMetrics: {
    emailOpenRate: 0.245,
    clickThroughRate: 0.034,
    conversionRate: 0.028,
    bounceRate: 0.156
  },
  revenueData: [
    { month: 'Jan', revenue: 95000, customers: 2100 },
    { month: 'Feb', revenue: 105000, customers: 2300 },
    { month: 'Mar', revenue: 125000, customers: 2500 },
    { month: 'Apr', revenue: 115000, customers: 2400 },
    { month: 'May', revenue: 135000, customers: 2700 },
    { month: 'Jun', revenue: 145000, customers: 2900 },
  ]
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(mockDashboardData)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const { overview, recentActivity, topSegments, performanceMetrics } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Get insights into your customer segments and campaign performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="content-area">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(overview.totalCustomers)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Segments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {overview.activeSegments}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    +2 new this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(overview.totalRevenue)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    +18.2% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPercentage(overview.conversionRate)}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    -0.5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Segments */}
          <Card className="chart-container">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Performing Segments</CardTitle>
                  <CardDescription>Segments by revenue contribution</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Segment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSegments.map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{segment.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(segment.customers)} customers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(segment.revenue)}
                      </p>
                      <p className={`text-sm flex items-center ${
                        segment.growth > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {segment.growth > 0 ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(segment.growth)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card className="chart-container">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Key marketing metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <Badge variant="info">Email</Badge>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatPercentage(performanceMetrics.emailOpenRate)}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Open Rate</p>
                </div>

                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointer className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <Badge variant="success">CTR</Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatPercentage(performanceMetrics.clickThroughRate)}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Click Rate</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <Badge variant="secondary">Conv</Badge>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatPercentage(performanceMetrics.conversionRate)}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Conversion</p>
                </div>

                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <Badge variant="warning">Bounce</Badge>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {formatPercentage(performanceMetrics.bounceRate)}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Bounce Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and events</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'segment_created' ? 'bg-blue-500' :
                      activity.type === 'customer_added' ? 'bg-green-500' :
                      activity.type === 'campaign_sent' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create New Segment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Launch Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Set Up Integration
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}