'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Users, 
  Search,
  Zap
} from 'lucide-react'

const quickActions = [
  {
    title: 'New Ticket',
    description: 'Create a new support ticket',
    icon: Plus,
    action: () => console.log('New ticket'),
    color: 'bg-blue-500',
  },
  {
    title: 'Start Chat',
    description: 'Begin a live chat session',
    icon: MessageSquare,
    action: () => console.log('Start chat'),
    color: 'bg-green-500',
  },
  {
    title: 'Time Tracking',
    description: 'Track time on current tasks',
    icon: Clock,
    action: () => console.log('Time tracking'),
    color: 'bg-orange-500',
  },
  {
    title: 'Team Status',
    description: 'View team availability',
    icon: Users,
    action: () => console.log('Team status'),
    color: 'bg-purple-500',
  },
  {
    title: 'Search',
    description: 'Find tickets and customers',
    icon: Search,
    action: () => console.log('Search'),
    color: 'bg-gray-500',
  },
  {
    title: 'Automations',
    description: 'Manage automated workflows',
    icon: Zap,
    action: () => console.log('Automations'),
    color: 'bg-yellow-500',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Frequently used actions and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent"
              onClick={action.action}
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}