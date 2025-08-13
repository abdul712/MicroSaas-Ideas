'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'integration' | 'metric' | 'alert' | 'system'
  message: string
  timestamp: Date
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const activityConfig = {
  integration: {
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  metric: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  system: {
    icon: Activity,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon

              return (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-4 top-8 w-px h-6 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {activity.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center pt-3 border-t">
          <Button variant="link" size="sm" className="text-xs">
            View Activity Log
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}