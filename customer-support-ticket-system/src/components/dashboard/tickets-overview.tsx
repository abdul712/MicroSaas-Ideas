'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  MessageSquare,
  User,
  Calendar,
  Filter
} from 'lucide-react'
import { formatRelativeTime, getTicketStatusColor, getTicketPriorityColor, getInitials } from '@/lib/utils'

// Mock data for demonstration
const mockTickets = [
  {
    id: '1',
    ticketNumber: '#TK-2024-001',
    subject: 'Login issues with mobile app',
    status: 'OPEN',
    priority: 'HIGH',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    assignedAgent: {
      name: 'Sarah Wilson',
      avatar: null,
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    commentsCount: 3,
    tags: ['mobile', 'login'],
  },
  {
    id: '2',
    ticketNumber: '#TK-2024-002',
    subject: 'Billing question about upgrade',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    assignedAgent: {
      name: 'Mike Johnson',
      avatar: null,
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    commentsCount: 1,
    tags: ['billing', 'upgrade'],
  },
  {
    id: '3',
    ticketNumber: '#TK-2024-003',
    subject: 'Feature request: Dark mode',
    status: 'PENDING',
    priority: 'LOW',
    customerName: 'Alex Chen',
    customerEmail: 'alex@example.com',
    assignedAgent: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    commentsCount: 0,
    tags: ['feature-request'],
  },
  {
    id: '4',
    ticketNumber: '#TK-2024-004',
    subject: 'Cannot access dashboard',
    status: 'RESOLVED',
    priority: 'URGENT',
    customerName: 'Maria Garcia',
    customerEmail: 'maria@example.com',
    assignedAgent: {
      name: 'Sarah Wilson',
      avatar: null,
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    commentsCount: 5,
    tags: ['access', 'dashboard'],
  },
]

export function TicketsOverview() {
  const [activeTab, setActiveTab] = useState('all')

  const filteredTickets = mockTickets.filter((ticket) => {
    if (activeTab === 'all') return true
    return ticket.status.toLowerCase() === activeTab.toLowerCase()
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>
              Latest support tickets and their current status
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tickets found for this status
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Ticket Info */}
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
                        
                        <h4 className="font-medium truncate mb-1">
                          {ticket.subject}
                        </h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{ticket.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatRelativeTime(ticket.createdAt)}</span>
                          </div>
                          {ticket.commentsCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{ticket.commentsCount}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {ticket.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {ticket.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {ticket.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{ticket.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Assigned Agent */}
                      <div className="flex items-center space-x-2">
                        {ticket.assignedAgent ? (
                          <>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ticket.assignedAgent.avatar || ''} />
                              <AvatarFallback className="text-xs">
                                {getInitials(ticket.assignedAgent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground hidden sm:block">
                              {ticket.assignedAgent.name}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <span className="text-sm hidden sm:block">Unassigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* View All Link */}
            <div className="pt-4 border-t">
              <Link href="/dashboard/tickets">
                <Button variant="ghost" className="w-full">
                  View All Tickets
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}