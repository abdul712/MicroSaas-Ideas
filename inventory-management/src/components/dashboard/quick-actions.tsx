'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Scan, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Users,
  Warehouse,
  Plus
} from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    title: 'Add Product',
    description: 'Add new products to inventory',
    icon: Plus,
    href: '/dashboard/products/new',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    title: 'Scan Barcode',
    description: 'Quick product lookup and updates',
    icon: Scan,
    href: '/dashboard/scanner',
    color: 'text-green-600 bg-green-100'
  },
  {
    title: 'Create Purchase Order',
    description: 'Order new stock from suppliers',
    icon: ShoppingCart,
    href: '/dashboard/purchase-orders/new',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    title: 'Stock Transfer',
    description: 'Move inventory between locations',
    icon: Warehouse,
    href: '/dashboard/transfers/new',
    color: 'text-orange-600 bg-orange-100'
  },
  {
    title: 'Add Supplier',
    description: 'Register new supplier',
    icon: Users,
    href: '/dashboard/suppliers/new',
    color: 'text-indigo-600 bg-indigo-100'
  },
  {
    title: 'Generate Report',
    description: 'Create inventory reports',
    icon: FileText,
    href: '/dashboard/reports',
    color: 'text-gray-600 bg-gray-100'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts for efficient inventory management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              asChild
            >
              <Link href={action.href}>
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}