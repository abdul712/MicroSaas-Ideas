'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  Users,
  ShoppingCart,
  UserMinus
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'

interface MetricData {
  value: number
  change: number
  period: string
}

interface MetricsData {
  revenue: MetricData
  expenses: MetricData
  cashFlow: MetricData
  customers: MetricData
  conversionRate: MetricData
  churnRate: MetricData
}

interface MetricsGridProps {
  metrics: MetricsData
}

const metricConfigs = [
  {
    key: 'revenue' as keyof MetricsData,
    title: 'Revenue',
    icon: DollarSign,
    formatter: (value: number) => formatCurrency(value),
    color: 'text-green-600'
  },
  {
    key: 'expenses' as keyof MetricsData,
    title: 'Expenses',
    icon: CreditCard,
    formatter: (value: number) => formatCurrency(value),
    color: 'text-red-600'
  },
  {
    key: 'cashFlow' as keyof MetricsData,
    title: 'Cash Flow',
    icon: Activity,
    formatter: (value: number) => formatCurrency(value),
    color: 'text-blue-600'
  },
  {
    key: 'customers' as keyof MetricsData,
    title: 'Active Customers',
    icon: Users,
    formatter: (value: number) => formatNumber(value),
    color: 'text-purple-600'
  },
  {
    key: 'conversionRate' as keyof MetricsData,
    title: 'Conversion Rate',
    icon: ShoppingCart,
    formatter: (value: number) => `${value}%`,
    color: 'text-orange-600'
  },
  {
    key: 'churnRate' as keyof MetricsData,
    title: 'Churn Rate',
    icon: UserMinus,
    formatter: (value: number) => `${value}%`,
    color: 'text-gray-600'
  }
]

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricConfigs.map((config) => {
          const metric = metrics[config.key]
          const Icon = config.icon
          const isPositive = metric.change > 0
          const isNegative = metric.change < 0
          
          // For certain metrics, negative change is actually good (expenses, churn rate)
          const isGoodChange = config.key === 'expenses' || config.key === 'churnRate' 
            ? metric.change < 0 
            : metric.change > 0

          return (
            <Card key={config.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {config.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {config.formatter(metric.value)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {isPositive && (
                        <TrendingUp className={`h-3 w-3 ${isGoodChange ? 'text-green-500' : 'text-red-500'}`} />
                      )}
                      {isNegative && (
                        <TrendingDown className={`h-3 w-3 ${isGoodChange ? 'text-green-500' : 'text-red-500'}`} />
                      )}
                      <span className={`text-xs font-medium ${
                        isGoodChange ? 'text-green-500' : isNegative || isPositive ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {isPositive && '+'}{Math.abs(metric.change)}%
                      </span>
                    </div>
                    
                    <Badge variant="secondary" className="text-xs">
                      {metric.period}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Monthly Summary</h4>
              <p className="text-sm text-blue-700">
                Revenue is {metrics.revenue.change > 0 ? 'up' : 'down'} {Math.abs(metrics.revenue.change)}%, 
                with {formatNumber(metrics.customers.value)} active customers
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(metrics.revenue.value - metrics.expenses.value)}
              </div>
              <div className="text-sm text-blue-600">Net Income</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}