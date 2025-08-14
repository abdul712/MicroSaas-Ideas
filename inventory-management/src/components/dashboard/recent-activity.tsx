'use client'

import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ArrowDown, ArrowUp, Package, RefreshCw } from 'lucide-react'

// Mock data - in real app this would come from API
const recentActivities = [
  {
    id: '1',
    type: 'stock_in',
    description: 'Received inventory from Supplier ABC',
    product: 'iPhone 15 Pro Max',
    quantity: 50,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    user: 'John Smith'
  },
  {
    id: '2',
    type: 'stock_out',
    description: 'Product sold via Shopify',
    product: 'Samsung Galaxy S24',
    quantity: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: 'Auto System'
  },
  {
    id: '3',
    type: 'adjustment',
    description: 'Stock count adjustment',
    product: 'MacBook Air M3',
    quantity: -3,
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    user: 'Jane Doe'
  },
  {
    id: '4',
    type: 'transfer',
    description: 'Transferred between locations',
    product: 'AirPods Pro 2',
    quantity: 10,
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    user: 'Mike Johnson'
  },
  {
    id: '5',
    type: 'stock_in',
    description: 'New product added to inventory',
    product: 'iPad Pro 12.9"',
    quantity: 25,
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    user: 'Sarah Wilson'
  }
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'stock_in':
      return <ArrowUp className="h-4 w-4 text-green-600" />
    case 'stock_out':
      return <ArrowDown className="h-4 w-4 text-red-600" />
    case 'adjustment':
      return <Package className="h-4 w-4 text-blue-600" />
    case 'transfer':
      return <RefreshCw className="h-4 w-4 text-purple-600" />
    default:
      return <Package className="h-4 w-4 text-gray-600" />
  }
}

function getActivityBadge(type: string) {
  switch (type) {
    case 'stock_in':
      return <Badge className="bg-green-100 text-green-800">Stock In</Badge>
    case 'stock_out':
      return <Badge className="bg-red-100 text-red-800">Stock Out</Badge>
    case 'adjustment':
      return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>
    case 'transfer':
      return <Badge className="bg-purple-100 text-purple-800">Transfer</Badge>
    default:
      return <Badge>Unknown</Badge>
  }
}

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg">
          <div className="p-2 bg-gray-100 rounded-full">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {activity.description}
              </p>
              {getActivityBadge(activity.type)}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{activity.product}</span>
              <span className="mx-2">•</span>
              <span className={activity.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
              </span>
            </p>
            
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span>{formatDateTime(activity.timestamp)}</span>
              <span className="mx-2">•</span>
              <span>by {activity.user}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}