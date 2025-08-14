'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react'

const stats = [
  {
    title: 'Total Tickets',
    value: '11',
    change: '+2 this week',
    changeType: 'neutral' as const,
    icon: Ticket,
    description: 'All time'
  },
  {
    title: 'Open Tickets',
    value: '2',
    change: '-1 from last week',
    changeType: 'positive' as const,
    icon: Clock,
    description: 'Currently active'
  },
  {
    title: 'Resolved Tickets',
    value: '8',
    change: '+3 this week',
    changeType: 'positive' as const,
    icon: CheckCircle,
    description: 'Successfully closed'
  },
  {
    title: 'Avg Response Time',
    value: '1.5h',
    change: '15min faster',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'Last 30 days'
  },
  {
    title: 'Messages Sent',
    value: '23',
    change: '+5 this week',
    changeType: 'neutral' as const,
    icon: MessageSquare,
    description: 'Total communications'
  },
  {
    title: 'Last Contact',
    value: '2 days',
    change: 'ago',
    changeType: 'neutral' as const,
    icon: Calendar,
    description: 'Most recent ticket'
  },
]

export function CustomerPortalOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={
                  stat.changeType === 'positive' 
                    ? 'default' 
                    : stat.changeType === 'negative' 
                    ? 'destructive' 
                    : 'secondary'
                }
                className="text-xs"
              >
                {stat.change}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}