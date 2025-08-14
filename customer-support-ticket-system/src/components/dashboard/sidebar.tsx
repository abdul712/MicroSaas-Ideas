'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  BookOpen,
  Tags,
  Clock,
  Zap,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Tickets',
    href: '/dashboard/tickets',
    icon: Ticket,
  },
  {
    name: 'Live Chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    name: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: BookOpen,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Automations',
    href: '/dashboard/automations',
    icon: Zap,
  },
  {
    name: 'Tags',
    href: '/dashboard/tags',
    icon: Tags,
  },
  {
    name: 'Time Tracking',
    href: '/dashboard/time',
    icon: Clock,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block w-64 bg-muted/40 border-r min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium mb-3">Today's Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Tickets</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolved</span>
              <span className="font-medium text-green-600">24</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}