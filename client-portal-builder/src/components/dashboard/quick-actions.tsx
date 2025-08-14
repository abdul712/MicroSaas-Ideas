'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Globe, Users, FileText, Settings } from 'lucide-react'

const quickActions = [
  {
    title: 'New Portal',
    description: 'Create a client portal',
    icon: Globe,
    href: '/dashboard/portals/new',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
  },
  {
    title: 'Add Client',
    description: 'Register new client',
    icon: Users,
    href: '/dashboard/clients/new',
    color: 'bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30'
  },
  {
    title: 'Upload Files',
    description: 'Share new files',
    icon: FileText,
    href: '/dashboard/files/upload',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
  },
  {
    title: 'Settings',
    description: 'Manage account',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <CardDescription>
          Common tasks to get you started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            className={`w-full justify-start h-auto p-4 ${action.color} transition-colors`}
            asChild
          >
            <Link href={action.href}>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs opacity-75">{action.description}</p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}