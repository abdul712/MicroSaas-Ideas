'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JourneyVisualizer } from '@/components/journey/journey-visualizer'
import { SankeyFunnel } from '@/components/journey/sankey-funnel'
import {
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Target,
  Clock,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'

// Mock data - in a real app, this would come from your API
const mockJourneyData = {
  nodes: [
    { id: 'landing', name: 'Landing Page', type: 'touchpoint' as const, visitors: 5000, conversions: 3500 },
    { id: 'signup', name: 'Sign Up', type: 'touchpoint' as const, visitors: 3500, conversions: 2800 },
    { id: 'onboarding', name: 'Onboarding', type: 'stage' as const, visitors: 2800, conversions: 2400 },
    { id: 'trial', name: 'Free Trial', type: 'stage' as const, visitors: 2400, conversions: 1200 },
    { id: 'purchase', name: 'Purchase', type: 'touchpoint' as const, visitors: 1200, conversions: 850 },
  ],
  links: [
    { source: 'landing', target: 'signup', value: 3500, type: 'conversion' as const },
    { source: 'signup', target: 'onboarding', value: 2800, type: 'conversion' as const },
    { source: 'onboarding', target: 'trial', value: 2400, type: 'conversion' as const },
    { source: 'trial', target: 'purchase', value: 850, type: 'conversion' as const },
  ]
}

const mockFunnelData = [
  { id: 'visitors', name: 'Website Visitors', value: 5000, conversions: 5000 },
  { id: 'signup', name: 'Sign Up', value: 3500, conversions: 3500, dropoffs: 1500 },
  { id: 'trial', name: 'Start Trial', value: 2800, conversions: 2800, dropoffs: 700 },
  { id: 'active', name: 'Active Usage', value: 2400, conversions: 2400, dropoffs: 400 },
  { id: 'purchase', name: 'Purchase', value: 850, conversions: 850, dropoffs: 1550 },
]

export function DashboardOverview() {
  const [metrics, setMetrics] = useState({
    totalUsers: 24680,
    activeJourneys: 12,
    conversionRate: 0.342,
    avgSessionTime: 342000, // in milliseconds
    revenueThisMonth: 45280,
    growthRate: 0.126
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatPercentage = (value: number) => 
    `${(value * 100).toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Real-time insights into your customer journeys</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{formatPercentage(metrics.growthRate)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.conversionRate)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.3% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.avgSessionTime)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -8s from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{formatPercentage(metrics.growthRate)} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Journey Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <JourneyVisualizer
          data={mockJourneyData}
          width={600}
          height={400}
          onNodeClick={(node) => console.log('Node clicked:', node)}
          onLinkClick={(link) => console.log('Link clicked:', link)}
        />

        <SankeyFunnel
          data={mockFunnelData}
          width={600}
          height={400}
          onStepClick={(step) => console.log('Step clicked:', step)}
        />
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'New journey created',
                  details: 'E-commerce Checkout Flow',
                  time: '2 minutes ago',
                  type: 'create'
                },
                {
                  action: 'Conversion spike detected',
                  details: 'Sign-up page +15% conversion',
                  time: '1 hour ago',
                  type: 'alert'
                },
                {
                  action: 'Journey optimization',
                  details: 'Mobile onboarding improved',
                  time: '3 hours ago',
                  type: 'optimize'
                },
                {
                  action: 'New integration connected',
                  details: 'Shopify store linked',
                  time: '1 day ago',
                  type: 'integration'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'create' ? 'bg-blue-500' :
                    activity.type === 'alert' ? 'bg-green-500' :
                    activity.type === 'optimize' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>AI Insights</span>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Beta
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  insight: 'Optimize mobile onboarding',
                  description: 'Mobile users drop off 23% more during step 2. Consider simplifying the form.',
                  impact: 'High',
                  action: 'View Details'
                },
                {
                  insight: 'Email timing opportunity',
                  description: 'Sending follow-up emails 2 hours earlier could improve open rates by 12%.',
                  impact: 'Medium',
                  action: 'Apply'
                },
                {
                  insight: 'Cross-sell potential',
                  description: 'Users who complete onboarding are 3x more likely to upgrade within 30 days.',
                  impact: 'High',
                  action: 'Setup Campaign'
                }
              ].map((insight, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{insight.insight}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <Button variant="outline" size="sm" className="text-xs">
                    {insight.action}
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}