'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  MessageCircle,
  Settings,
  Calendar,
  Palette,
} from 'lucide-react'

const items = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Building2,
  },
  {
    title: 'Sites',
    href: '/dashboard/sites',
    icon: Palette,
  },
  {
    title: 'Members',
    href: '/dashboard/members',
    icon: Users,
  },
  {
    title: 'Content',
    href: '/dashboard/content',
    icon: FileText,
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Community',
    href: '/dashboard/community',
    icon: MessageCircle,
  },
  {
    title: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href ? 'bg-accent' : 'transparent'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}