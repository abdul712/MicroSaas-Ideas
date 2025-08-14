'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package } from 'lucide-react'

// Mock data - in real app this would come from API
const lowStockItems = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    sku: 'IPHONE-15-PM-256',
    currentStock: 3,
    reorderPoint: 10,
    status: 'low-stock'
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    sku: 'SAMSUNG-S24-128',
    currentStock: 0,
    reorderPoint: 15,
    status: 'out-of-stock'
  },
  {
    id: '3',
    name: 'MacBook Air M3',
    sku: 'MBA-M3-512',
    currentStock: 2,
    reorderPoint: 8,
    status: 'low-stock'
  },
  {
    id: '4',
    name: 'AirPods Pro 2',
    sku: 'APP-2-WHITE',
    currentStock: 5,
    reorderPoint: 20,
    status: 'low-stock'
  }
]

export function LowStockAlerts() {
  return (
    <div className="space-y-4">
      {lowStockItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              item.status === 'out-of-stock' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {item.status === 'out-of-stock' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.sku}</p>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant={item.status === 'out-of-stock' ? 'destructive' : 'secondary'}>
              {item.currentStock} / {item.reorderPoint}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {item.status === 'out-of-stock' ? 'Out of stock' : 'Low stock'}
            </p>
          </div>
        </div>
      ))}
      
      <Button className="w-full" variant="outline">
        View All Alerts
      </Button>
    </div>
  )
}