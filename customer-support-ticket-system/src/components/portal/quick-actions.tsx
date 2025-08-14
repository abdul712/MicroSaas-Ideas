'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  MessageSquare, 
  BookOpen, 
  Phone,
  Search,
  FileText
} from 'lucide-react'

const quickActions = [
  {
    title: 'Submit Ticket',
    description: 'Report an issue or ask for help',
    icon: Plus,
    href: '/portal/tickets/new',
    color: 'bg-blue-500',
  },
  {
    title: 'Live Chat',
    description: 'Chat with our support team',
    icon: MessageSquare,
    href: '/portal/chat',
    color: 'bg-green-500',
  },
  {
    title: 'Search Help',
    description: 'Find answers in our knowledge base',
    icon: Search,
    href: '/portal/knowledge',
    color: 'bg-purple-500',
  },
  {
    title: 'View Tickets',
    description: 'Check your ticket status',
    icon: FileText,
    href: '/portal/tickets',
    color: 'bg-orange-500',
  },
  {
    title: 'Contact Us',
    description: 'Get in touch directly',
    icon: Phone,
    href: '/portal/contact',
    color: 'bg-red-500',
  },
  {
    title: 'Documentation',
    description: 'Browse detailed guides',
    icon: BookOpen,
    href: '/portal/docs',
    color: 'bg-indigo-500',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and helpful shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent w-full"
              >
                <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}