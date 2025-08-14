'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 18500, prediction: null },
  { month: 'Feb', revenue: 22100, prediction: null },
  { month: 'Mar', revenue: 19800, prediction: null },
  { month: 'Apr', revenue: 26400, prediction: null },
  { month: 'May', revenue: 24700, prediction: null },
  { month: 'Jun', revenue: 28900, prediction: null },
  { month: 'Jul', revenue: 31200, prediction: null },
  { month: 'Aug', revenue: 29800, prediction: null },
  { month: 'Sep', revenue: 33100, prediction: null },
  { month: 'Oct', revenue: null, prediction: 35600 },
  { month: 'Nov', revenue: null, prediction: 38200 },
  { month: 'Dec', revenue: null, prediction: 42100 },
]

const customerData = [
  { month: 'Jan', customers: 1100 },
  { month: 'Feb', customers: 1180 },
  { month: 'Mar', customers: 1150 },
  { month: 'Apr', customers: 1240 },
  { month: 'May', customers: 1290 },
  { month: 'Jun', customers: 1350 },
  { month: 'Jul', customers: 1420 },
  { month: 'Aug', customers: 1380 },
  { month: 'Sep', customers: 1460 },
]

export function TrendCharts() {
  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend & Predictions</CardTitle>
              <CardDescription>
                Historical data with AI-powered forecasting
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="success">+24.5%</Badge>
              <Badge variant="secondary">95% confidence</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                />
                <YAxis 
                  className="text-xs"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    name === 'revenue' ? 'Actual Revenue' : 'Predicted Revenue'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="prediction" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Key insights */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">+35%</div>
              <div className="text-xs text-muted-foreground">Q4 Growth Expected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">$42.1k</div>
              <div className="text-xs text-muted-foreground">Dec Prediction</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">95%</div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Growth</CardTitle>
          <CardDescription>
            Active customer base over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                />
                <YAxis 
                  className="text-xs"
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()}`, 'Active Customers']}
                />
                <Area 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}