'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Package,
  Scan,
  Settings,
  Users,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  FileText
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Warehouse,
  },
  {
    name: 'Scanner',
    href: '/dashboard/scanner',
    icon: Scan,
  },
  {
    name: 'Purchase Orders',
    href: '/dashboard/purchase-orders',
    icon: ShoppingCart,
  },
  {
    name: 'Suppliers',
    href: '/dashboard/suppliers',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Alerts',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <Package className="h-8 w-8 text-blue-400" />
        <span className="ml-2 text-lg font-semibold">InventoryPro</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800',
                isActive && 'bg-gray-800 text-white'
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          <p>Inventory Pro v1.0</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  )
}