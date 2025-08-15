'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home,
  Upload,
  FileText,
  Mic2,
  Settings,
  BarChart3,
  Users,
  Download
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload Audio', href: '/dashboard/upload', icon: Upload },
  { name: 'Episodes', href: '/dashboard/episodes', icon: FileText },
  { name: 'Podcasts', href: '/dashboard/podcasts', icon: Mic2 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Exports', href: '/dashboard/exports', icon: Download },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:top-16 lg:bg-white lg:border-r lg:border-gray-200 dark:lg:bg-gray-800 dark:lg:border-gray-700">
      <div className="flex flex-col flex-1 min-h-0 pt-6">
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-podcast-100 text-podcast-900 dark:bg-podcast-900 dark:text-podcast-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <item.icon 
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive 
                      ? 'text-podcast-600 dark:text-podcast-400'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )} 
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-podcast-50 dark:bg-podcast-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-podcast-900 dark:text-podcast-100">
              Need help?
            </h3>
            <p className="text-xs text-podcast-700 dark:text-podcast-300 mt-1">
              Check out our documentation and tutorials.
            </p>
            <Link
              href="/help"
              className="inline-block mt-2 text-xs font-medium text-podcast-600 dark:text-podcast-400 hover:text-podcast-800 dark:hover:text-podcast-200"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}