'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  MessageSquare,
  AlertCircle,
  Target
} from 'lucide-react'

const stats = [
  {
    title: 'Total Tickets',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Ticket,
    description: 'This month'
  },
  {
    title: 'Avg Response Time',
    value: '2.4h',
    change: '-23.1%',
    changeType: 'positive' as const,
    icon: Clock,
    description: 'Last 7 days'
  },
  {
    title: 'Resolution Rate',
    value: '94.2%',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: CheckCircle,
    description: 'This month'
  },
  {
    title: 'Customer Satisfaction',
    value: '4.8/5',
    change: '+0.2',
    changeType: 'positive' as const,
    icon: Target,
    description: 'Average rating'
  },
  {
    title: 'Active Agents',
    value: '12',
    change: '+2',
    changeType: 'positive' as const,
    icon: Users,
    description: 'Currently online'
  },
  {
    title: 'Live Chats',
    value: '34',
    change: '+8',
    changeType: 'positive' as const,
    icon: MessageSquare,
    description: 'Active sessions'
  },
  {
    title: 'Urgent Tickets',
    value: '5',
    change: '-3',
    changeType: 'positive' as const,
    icon: AlertCircle,
    description: 'Requiring attention'
  },
  {
    title: 'Weekly Growth',
    value: '18.2%',
    change: '+4.7%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'Ticket volume'
  },
]

export function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
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