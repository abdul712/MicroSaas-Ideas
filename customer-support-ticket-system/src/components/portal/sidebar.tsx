'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  MessageSquare,
  Phone,
  FileText,
  HelpCircle,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/portal',
    icon: LayoutDashboard,
  },
  {
    name: 'My Tickets',
    href: '/portal/tickets',
    icon: Ticket,
  },
  {
    name: 'Submit Ticket',
    href: '/portal/tickets/new',
    icon: FileText,
  },
  {
    name: 'Knowledge Base',
    href: '/portal/knowledge',
    icon: BookOpen,
  },
  {
    name: 'Live Chat',
    href: '/portal/chat',
    icon: MessageSquare,
  },
  {
    name: 'Contact Us',
    href: '/portal/contact',
    icon: Phone,
  },
  {
    name: 'Help & FAQ',
    href: '/portal/help',
    icon: HelpCircle,
  },
]

export function CustomerPortalSidebar() {
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

        {/* Support Status */}
        <div className="mt-8 p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium mb-3">Support Status</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">All systems operational</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: 2 minutes ago
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium mb-3">Your Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Tickets</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolved</span>
              <span className="font-medium text-green-600">8</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}