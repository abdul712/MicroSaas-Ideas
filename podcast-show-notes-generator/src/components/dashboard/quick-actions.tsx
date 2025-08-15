'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Plus, 
  FileText, 
  Settings, 
  Zap,
  ArrowRight 
} from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'Upload New Episode',
      description: 'Upload an audio file to generate show notes',
      icon: Upload,
      href: '/dashboard/upload',
      primary: true
    },
    {
      title: 'Create Podcast',
      description: 'Set up a new podcast with custom branding',
      icon: Plus,
      href: '/dashboard/podcasts/new',
      primary: false
    },
    {
      title: 'View Templates',
      description: 'Browse and customize show notes templates',
      icon: FileText,
      href: '/dashboard/templates',
      primary: false
    },
    {
      title: 'Account Settings',
      description: 'Manage your subscription and preferences',
      icon: Settings,
      href: '/dashboard/settings',
      primary: false
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 text-podcast-600 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-podcast-300 dark:hover:border-podcast-600 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    action.primary 
                      ? 'bg-podcast-100 dark:bg-podcast-900/20' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <action.icon className={`h-5 w-5 ${
                      action.primary 
                        ? 'text-podcast-600' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-podcast-600 dark:group-hover:text-podcast-400 transition-colors">
                        {action.title}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-podcast-600 dark:group-hover:text-podcast-400 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}