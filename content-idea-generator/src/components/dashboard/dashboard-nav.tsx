'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  Calendar,
  Target
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Generate Ideas',
    href: '/dashboard/generate',
    icon: Lightbulb,
  },
  {
    name: 'My Ideas',
    href: '/dashboard/ideas',
    icon: BookOpen,
  },
  {
    name: 'Trending Topics',
    href: '/dashboard/trends',
    icon: TrendingUp,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Content Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    name: 'Niches',
    href: '/dashboard/niches',
    icon: Target,
  },
  {
    name: 'Competitors',
    href: '/dashboard/competitors',
    icon: Users,
  },
]

const bottomNavigation = [
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-muted/30 border-r border-border min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-border">
        <div className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Quick Stats
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Ideas Generated</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between">
              <span>This Month</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}