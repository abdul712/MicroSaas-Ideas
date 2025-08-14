'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Clock, 
  MessageSquare,
  Eye,
  Calendar
} from 'lucide-react'
import { formatRelativeTime, getTicketStatusColor, getTicketPriorityColor } from '@/lib/utils'

// Mock data for demonstration
const mockTickets = [
  {
    id: '1',
    ticketNumber: '#TK-2024-001',
    subject: 'Login issues with mobile app',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    commentsCount: 3,
  },
  {
    id: '2',
    ticketNumber: '#TK-2024-002',
    subject: 'Billing question about upgrade',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    commentsCount: 1,
  },
  {
    id: '3',
    ticketNumber: '#TK-2024-003',
    subject: 'Feature request: Dark mode',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    commentsCount: 5,
  },
  {
    id: '4',
    ticketNumber: '#TK-2024-004',
    subject: 'Cannot access dashboard after password reset',
    status: 'CLOSED',
    priority: 'URGENT',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    commentsCount: 8,
  },
]

export function RecentTickets() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Recent Tickets</CardTitle>
            <CardDescription>
              Latest support requests and their current status
            </CardDescription>
          </div>
          <Link href="/portal/tickets">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTickets.slice(0, 3).map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {ticket.ticketNumber}
                  </span>
                  <Badge className={getTicketStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={getTicketPriorityColor(ticket.priority)}
                  >
                    {ticket.priority}
                  </Badge>
                </div>
                
                <h4 className="font-medium truncate mb-2">
                  {ticket.subject}
                </h4>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatRelativeTime(ticket.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated {formatRelativeTime(ticket.lastUpdated)}</span>
                  </div>
                  {ticket.commentsCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{ticket.commentsCount} replies</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link href={`/portal/tickets/${ticket.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {mockTickets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No tickets yet</p>
            <p className="text-sm mb-4">Submit your first support ticket to get started</p>
            <Link href="/portal/tickets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}