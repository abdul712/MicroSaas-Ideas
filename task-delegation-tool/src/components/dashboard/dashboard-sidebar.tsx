'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Organization, TeamMember, Team } from '@prisma/client'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Calendar, 
  Settings,
  Brain,
  Zap,
  BarChart3,
  FolderOpen,
  Timer,
  UserCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardSidebarProps {
  user: User & {
    organization: Organization
    teamMemberships: (TeamMember & { team: Team })[]
  }
}

interface NavItem {
  name: string
  href: string
  icon: any
  current?: boolean
  badge?: string | number
  children?: NavItem[]
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(['tasks'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const navigation: NavItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      current: pathname.startsWith('/dashboard/tasks'),
      badge: '12',
      children: [
        { name: 'My Tasks', href: '/dashboard/tasks/my', icon: UserCheck },
        { name: 'Assigned by Me', href: '/dashboard/tasks/delegated', icon: Users },
        { name: 'All Tasks', href: '/dashboard/tasks/all', icon: CheckSquare },
        { name: 'Board View', href: '/dashboard/tasks/board', icon: FolderOpen },
        { name: 'Calendar View', href: '/dashboard/tasks/calendar', icon: Calendar },
      ]
    },
    {
      name: 'AI Insights',
      href: '/dashboard/ai',
      icon: Brain,
      current: pathname.startsWith('/dashboard/ai'),
      children: [
        { name: 'Task Intelligence', href: '/dashboard/ai/tasks', icon: Brain },
        { name: 'Workload Analysis', href: '/dashboard/ai/workload', icon: TrendingUp },
        { name: 'Performance Predictions', href: '/dashboard/ai/predictions', icon: Zap },
        { name: 'Team Optimization', href: '/dashboard/ai/optimization', icon: Users },
      ]
    },
    {
      name: 'Team',
      href: '/dashboard/team',
      icon: Users,
      current: pathname.startsWith('/dashboard/team'),
      children: [
        { name: 'Team Members', href: '/dashboard/team/members', icon: Users },
        { name: 'Workload', href: '/dashboard/team/workload', icon: BarChart3 },
        { name: 'Performance', href: '/dashboard/team/performance', icon: TrendingUp },
        { name: 'Capacity Planning', href: '/dashboard/team/capacity', icon: Timer },
      ]
    },
    {
      name: 'Projects',
      href: '/dashboard/projects',
      icon: FolderOpen,
      current: pathname.startsWith('/dashboard/projects'),
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/dashboard/analytics'),
      children: [
        { name: 'Task Analytics', href: '/dashboard/analytics/tasks', icon: CheckSquare },
        { name: 'Team Performance', href: '/dashboard/analytics/performance', icon: TrendingUp },
        { name: 'Productivity Insights', href: '/dashboard/analytics/productivity', icon: Zap },
        { name: 'Custom Reports', href: '/dashboard/analytics/reports', icon: BarChart3 },
      ]
    },
  ]

  const bottomNavigation: NavItem[] = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname.startsWith('/dashboard/settings'),
    }
  ]

  const canManageTeam = ['admin', 'manager'].includes(user.role)

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-16">
      <div className="flex flex-col h-full">
        {/* Organization Info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user.organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {user.organization.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.organization.planType} Plan
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleSection(item.name.toLowerCase())}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      item.current
                        ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {expandedSections.includes(item.name.toLowerCase()) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSections.includes(item.name.toLowerCase()) && (
                    <div className="mt-2 space-y-1 pl-8">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                            pathname === child.href
                              ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          )}
                        >
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    item.current
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                item.current
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Upgrade Prompt for Free Plan */}
        {user.organization.planType === 'free' && (
          <div className="px-4 py-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Upgrade to Pro</span>
              </div>
              <p className="text-xs mt-1 opacity-90">
                Unlock AI-powered insights and advanced features
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-2 text-xs font-medium underline hover:no-underline"
              >
                Learn more
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}