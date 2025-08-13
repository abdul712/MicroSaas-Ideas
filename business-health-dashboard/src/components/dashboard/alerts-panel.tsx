'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  Eye,
  Clock
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Alert {
  id: string
  type: string
  title: string
  description: string
  timestamp: Date
  severity: 'info' | 'warning' | 'critical'
}

interface AlertsPanelProps {
  alerts: Alert[]
}

const severityConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    badgeVariant: 'secondary' as const
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    badgeVariant: 'secondary' as const
  },
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    badgeVariant: 'destructive' as const
  }
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set())
  
  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg font-semibold">Active Alerts</CardTitle>
          <div className="flex items-center space-x-2 mt-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {warningCount} Warning
              </Badge>
            )}
            {visibleAlerts.length === 0 && (
              <Badge variant="outline" className="text-xs text-green-600">
                All Clear
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No active alerts</p>
            <p className="text-xs text-gray-400">Your business is running smoothly!</p>
          </div>
        ) : (
          visibleAlerts.slice(0, 5).map((alert) => {
            const config = severityConfig[alert.severity]
            const Icon = config.icon

            return (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} relative group`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-4 w-4 ${config.iconColor} mt-0.5 flex-shrink-0`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                        {alert.title}
                      </h4>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(alert.timestamp)}</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {visibleAlerts.length > 5 && (
          <div className="text-center pt-2 border-t">
            <Button variant="link" size="sm" className="text-xs">
              View {visibleAlerts.length - 5} more alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}