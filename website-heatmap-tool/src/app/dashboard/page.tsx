'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MousePointerClick, 
  Eye, 
  BarChart3, 
  Users, 
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Settings,
  Plus,
  RefreshCw
} from 'lucide-react'
import { HeatmapVisualization } from '@/components/heatmap/heatmap-visualization'
import { ScrollHeatmapVisualization } from '@/components/heatmap/scroll-heatmap-visualization'
import { RealTimeMetrics } from '@/components/dashboard/real-time-metrics'
import { WebsiteSelector } from '@/components/dashboard/website-selector'
import { DateRangePicker } from '@/components/dashboard/date-range-picker'

interface DashboardStats {
  totalViews: number
  uniqueVisitors: number
  averageTimeOnPage: number
  bounceRate: number
  activeSessions: number
  topPages: Array<{
    url: string
    views: number
    conversionRate: number
  }>
}

const mockStats: DashboardStats = {
  totalViews: 12453,
  uniqueVisitors: 8920,
  averageTimeOnPage: 165,
  bounceRate: 42.3,
  activeSessions: 23,
  topPages: [
    { url: '/homepage', views: 4521, conversionRate: 12.4 },
    { url: '/products', views: 3892, conversionRate: 8.7 },
    { url: '/pricing', views: 2103, conversionRate: 15.2 },
    { url: '/about', views: 1937, conversionRate: 3.1 },
  ]
}

export default function DashboardPage() {
  const [selectedWebsite, setSelectedWebsite] = useState('demo-site')
  const [selectedUrl, setSelectedUrl] = useState('/homepage')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  })
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>(mockStats)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HeatMap Analytics
                </span>
              </div>
              <Badge variant="secondary">Pro Plan</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <WebsiteSelector 
            value={selectedWebsite} 
            onValueChange={setSelectedWebsite}
          />
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        </div>

        {/* Real-time metrics */}
        <RealTimeMetrics />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.3%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.uniqueVisitors)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.7%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.averageTimeOnPage)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-2.1%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bounceRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-3.2%</span> from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Heatmap Visualization */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Heatmap Analysis</CardTitle>
                    <CardDescription>
                      Visual representation of user interactions on {selectedUrl}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter page URL"
                      value={selectedUrl}
                      onChange={(e) => setSelectedUrl(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="clicks" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="clicks">Click Heatmap</TabsTrigger>
                    <TabsTrigger value="scroll">Scroll Heatmap</TabsTrigger>
                    <TabsTrigger value="attention">Attention Map</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="clicks" className="mt-6">
                    <HeatmapVisualization
                      websiteId={selectedWebsite}
                      url={selectedUrl}
                      dateRange={dateRange}
                      type="clicks"
                    />
                  </TabsContent>
                  
                  <TabsContent value="scroll" className="mt-6">
                    <ScrollHeatmapVisualization
                      websiteId={selectedWebsite}
                      url={selectedUrl}
                      dateRange={dateRange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="attention" className="mt-6">
                    <HeatmapVisualization
                      websiteId={selectedWebsite}
                      url={selectedUrl}
                      dateRange={dateRange}
                      type="attention"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topPages.map((page, index) => (
                    <div key={page.url} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setSelectedUrl(page.url)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block w-full text-left"
                        >
                          {page.url}
                        </button>
                        <p className="text-xs text-gray-500">
                          {formatNumber(page.views)} views • {page.conversionRate}% conversion
                        </p>
                      </div>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Insights</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          High click area detected
                        </p>
                        <p className="text-xs text-blue-700">
                          Users are frequently clicking on your main CTA button. Consider A/B testing different colors.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          Low scroll depth
                        </p>
                        <p className="text-xs text-yellow-700">
                          Most users only scroll 60% down the page. Consider moving important content higher.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Mobile performance
                        </p>
                        <p className="text-xs text-green-700">
                          Mobile users have 15% higher engagement than desktop users.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}