'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Zap,
  DollarSign,
  Users,
  RefreshCw,
  Settings,
  Plus
} from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  lowStockItems: number
  totalValue: number
  reorderAlerts: number
  forecastAccuracy: number
  avgTurnover: number
}

interface Product {
  id: string
  title: string
  sku: string
  currentStock: number
  reorderPoint: number
  status: 'good' | 'low' | 'out' | 'high'
  value: number
  lastSale: string
}

interface ReorderAlert {
  id: string
  productTitle: string
  currentStock: number
  reorderPoint: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendedQuantity: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    reorderAlerts: 0,
    forecastAccuracy: 0,
    avgTurnover: 0,
  })

  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Simulate API calls (in production, these would be real API endpoints)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
      
      setStats({
        totalProducts: 1247,
        lowStockItems: 23,
        totalValue: 145250,
        reorderAlerts: 8,
        forecastAccuracy: 87.5,
        avgTurnover: 4.2,
      })

      setLowStockProducts([
        {
          id: '1',
          title: 'Premium Wireless Headphones',
          sku: 'PWH-001',
          currentStock: 5,
          reorderPoint: 20,
          status: 'low',
          value: 2499.95,
          lastSale: '2 hours ago'
        },
        {
          id: '2',
          title: 'Smart Phone Case - Black',
          sku: 'SPC-BLK-128',
          currentStock: 0,
          reorderPoint: 50,
          status: 'out',
          value: 0,
          lastSale: '1 day ago'
        },
        {
          id: '3',
          title: 'Bluetooth Speaker Mini',
          sku: 'BSM-002',
          currentStock: 12,
          reorderPoint: 30,
          status: 'low',
          value: 359.88,
          lastSale: '4 hours ago'
        }
      ])

      setReorderAlerts([
        {
          id: '1',
          productTitle: 'Premium Wireless Headphones',
          currentStock: 5,
          reorderPoint: 20,
          urgency: 'HIGH',
          recommendedQuantity: 50
        },
        {
          id: '2',
          productTitle: 'Smart Phone Case - Black',
          currentStock: 0,
          reorderPoint: 50,
          urgency: 'CRITICAL',
          recommendedQuantity: 100
        }
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'low': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-blue-600 bg-blue-100'
      case 'out': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'CRITICAL': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
                <p className="text-gray-600">Real-time inventory management and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={fetchDashboardData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
              <p className="text-xs text-green-600">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Low Stock Items
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <p className="text-xs text-yellow-600">
                Needs immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Inventory Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-green-600">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Reorder Alerts
              </CardTitle>
              <Zap className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.reorderAlerts}</div>
              <p className="text-xs text-red-600">
                Automated suggestions ready
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Forecast Accuracy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.forecastAccuracy}%</div>
              <p className="text-xs text-blue-600">
                AI prediction performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg. Turnover
              </CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.avgTurnover}x</div>
              <p className="text-xs text-purple-600">
                Times per year
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Products that need immediate restocking attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{product.title}</h4>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(product.status)}>
                          {product.status === 'out' ? 'Out of Stock' : `${product.currentStock} left`}
                        </Badge>
                        <span className="text-xs text-gray-500">Reorder at {product.reorderPoint}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${product.value.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500">Last sale: {product.lastSale}</p>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="outline">
                  View All Low Stock Items
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reorder Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 text-blue-500 mr-2" />
                AI Reorder Recommendations
              </CardTitle>
              <CardDescription>
                Smart suggestions based on demand forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reorderAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{alert.productTitle}</h4>
                      <Badge className={getUrgencyColor(alert.urgency)}>
                        {alert.urgency}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-3">
                      <span>Current: {alert.currentStock}</span>
                      <span>Reorder Point: {alert.reorderPoint}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Recommended: {alert.recommendedQuantity} units
                      </span>
                      <Button size="sm">
                        Create Order
                      </Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="outline">
                  View All Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common inventory management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Package className="w-6 h-6" />
                <span>Add New Product</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <RefreshCw className="w-6 h-6" />
                <span>Sync Inventory</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <BarChart3 className="w-6 h-6" />
                <span>Generate Report</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Settings className="w-6 h-6" />
                <span>Manage Rules</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}