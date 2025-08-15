'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react'

const mockInsights = [
  {
    id: '1',
    type: 'opportunity',
    severity: 'high',
    title: 'Q4 Revenue Surge Expected',
    description: 'Based on historical patterns, revenue typically increases 35% in Q4. Consider inventory scaling.',
    timestamp: '2 hours ago',
    dismissed: false
  },
  {
    id: '2',
    type: 'risk',
    severity: 'critical',
    title: 'Customer Churn Alert',
    description: 'Premium customer churn increased 12% this month. Immediate attention required.',
    timestamp: '4 hours ago',
    dismissed: false
  },
  {
    id: '3',
    type: 'anomaly',
    severity: 'medium',
    title: 'Traffic Spike Detected',
    description: 'Website traffic increased 200% on Tuesday. Investigate traffic source.',
    timestamp: '1 day ago',
    dismissed: false
  }
]

export function InsightsFeed() {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'risk':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'warning'
      case 'medium':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Insights Feed</CardTitle>
          <Badge variant="secondary">
            {mockInsights.filter(i => !i.dismissed).length} new
          </Badge>
        </div>
        <CardDescription>
          AI-powered insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockInsights.map((insight) => (
          <div
            key={insight.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <Badge variant={getSeverityVariant(insight.severity) as any} className="text-xs">
                  {insight.severity}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {insight.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{insight.timestamp}</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                View details
              </Button>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          View All Insights
        </Button>
      </CardContent>
    </Card>
  )
}