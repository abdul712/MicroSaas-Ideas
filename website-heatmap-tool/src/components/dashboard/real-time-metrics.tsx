'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, Eye, TrendingUp } from 'lucide-react'

interface RealTimeData {
  activeVisitors: number
  activeSessions: number
  pageViewsToday: number
  trend: 'up' | 'down' | 'stable'
  recentPages: Array<{
    url: string
    visitors: number
    timestamp: Date
  }>
}

export function RealTimeMetrics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    activeVisitors: 23,
    activeSessions: 18,
    pageViewsToday: 1247,
    trend: 'up',
    recentPages: [
      { url: '/homepage', visitors: 8, timestamp: new Date() },
      { url: '/products', visitors: 5, timestamp: new Date(Date.now() - 30000) },
      { url: '/pricing', visitors: 3, timestamp: new Date(Date.now() - 60000) },
      { url: '/about', visitors: 2, timestamp: new Date(Date.now() - 120000) },
    ]
  })

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeVisitors: Math.max(0, prev.activeVisitors + Math.floor(Math.random() * 6) - 2),
        activeSessions: Math.max(0, prev.activeSessions + Math.floor(Math.random() * 4) - 1),
        pageViewsToday: prev.pageViewsToday + Math.floor(Math.random() * 3),
        recentPages: prev.recentPages.map(page => ({
          ...page,
          visitors: Math.max(0, page.visitors + Math.floor(Math.random() * 3) - 1)
        }))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Active Visitors */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Live</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{realTimeData.activeVisitors}</div>
            {getTrendIcon(realTimeData.trend)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently browsing your site
          </p>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{realTimeData.activeSessions}</div>
          <p className="text-xs text-muted-foreground">
            Unique sessions in last 30 min
          </p>
        </CardContent>
      </Card>

      {/* Today's Page Views */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{realTimeData.pageViewsToday.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+8.2%</span> vs yesterday
          </p>
        </CardContent>
      </Card>

      {/* Top Active Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {realTimeData.recentPages.slice(0, 3).map((page, index) => (
              <div key={page.url} className="flex items-center justify-between text-xs">
                <div className="flex-1 truncate">
                  <span className="font-medium">{page.url}</span>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Badge variant="secondary" className="text-xs">
                    {page.visitors}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}