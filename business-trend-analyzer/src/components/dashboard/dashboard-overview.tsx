'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'

// Mock data - in real app this would come from your API
const mockMetrics = [
  {
    id: '1',
    title: 'Total Revenue',
    value: 245670,
    change: 0.124,
    trend: 'up',
    icon: DollarSign,
    format: 'currency'
  },
  {
    id: '2',
    title: 'Active Customers',
    value: 1247,
    change: 0.086,
    trend: 'up',
    icon: Users,
    format: 'number'
  },
  {
    id: '3',
    title: 'Orders',
    value: 542,
    change: -0.043,
    trend: 'down',
    icon: ShoppingCart,
    format: 'number'
  },
  {
    id: '4',
    title: 'Conversion Rate',
    value: 0.0324,
    change: 0.156,
    trend: 'up',
    icon: TrendingUp,
    format: 'percentage'
  }
]

const recentInsights = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Q4 Revenue Growth Opportunity',
    description: 'Historical data shows 35% revenue increase potential in Q4',
    severity: 'high',
    impact: 45000
  },
  {
    id: '2',
    type: 'risk',
    title: 'Customer Churn Alert',
    description: 'Churn rate increased 12% this month in premium segment',
    severity: 'critical',
    impact: -15000
  },
  {
    id: '3',
    type: 'anomaly',
    title: 'Unusual Traffic Pattern',
    description: 'Website traffic spiked 200% on Tuesday - investigate source',
    severity: 'medium',
    impact: 8000
  }
]

export function DashboardOverview() {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      default:
        return formatNumber(value)
    }
  }

  const getSeverityColor = (severity: string) => {
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
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockMetrics.map((metric) => {
            const Icon = metric.icon
            const isPositive = metric.change > 0
            const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
            const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
            
            return (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(metric.value, metric.format)}
                  </div>
                  <div className={`flex items-center text-sm ${changeColor}`}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    {formatPercentage(Math.abs(metric.change))} from last month
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Insights Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Insights</h2>
          <a href="/dashboard/insights" className="text-sm text-primary hover:underline">
            View all insights
          </a>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {recentInsights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={getSeverityColor(insight.severity) as any}>
                    {insight.severity.toUpperCase()}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 mr-1 text-green-500" />}
                    {insight.type === 'risk' && <TrendingDown className="h-4 w-4 mr-1 text-red-500" />}
                    {insight.type === 'anomaly' && <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />}
                    {insight.type}
                  </div>
                </div>
                <CardTitle className="text-base">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {insight.description}
                </CardDescription>
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm font-medium">
                    Potential Impact: {' '}
                    <span className={insight.impact > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(insight.impact)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}