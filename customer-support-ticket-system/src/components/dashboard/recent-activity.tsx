'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { 
  MessageSquare, 
  Ticket, 
  UserPlus, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react'

// Mock activity data
const activities = [
  {
    id: '1',
    type: 'ticket_created',
    user: {
      name: 'Sarah Wilson',
      avatar: null,
    },
    description: 'Created ticket #TK-2024-005',
    details: 'Payment processing error',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    icon: Ticket,
    color: 'text-blue-500',
  },
  {
    id: '2',
    type: 'ticket_resolved',
    user: {
      name: 'Mike Johnson',
      avatar: null,
    },
    description: 'Resolved ticket #TK-2024-003',
    details: 'Feature request: Dark mode',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    icon: CheckCircle,
    color: 'text-green-500',
  },
  {
    id: '3',
    type: 'comment_added',
    user: {
      name: 'Emma Davis',
      avatar: null,
    },
    description: 'Added comment to ticket #TK-2024-001',
    details: 'Provided troubleshooting steps',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    icon: MessageSquare,
    color: 'text-purple-500',
  },
  {
    id: '4',
    type: 'customer_joined',
    user: {
      name: 'Alex Chen',
      avatar: null,
    },
    description: 'New customer registered',
    details: 'alex@example.com',
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    icon: UserPlus,
    color: 'text-orange-500',
  },
  {
    id: '5',
    type: 'sla_warning',
    user: {
      name: 'System',
      avatar: null,
    },
    description: 'SLA warning for ticket #TK-2024-002',
    details: 'Response time approaching limit',
    timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
    icon: AlertCircle,
    color: 'text-red-500',
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions and updates across your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`mt-1 ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {activity.user.name !== 'System' && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.user.avatar || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm font-medium">
                    {activity.user.name}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
                
                {activity.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.details}
                  </p>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <button className="text-sm text-primary hover:underline">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  )
}