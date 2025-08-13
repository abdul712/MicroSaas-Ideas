'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Clock, User, MessageSquare, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM' | 'BOT'
  createdAt: string
}

interface Conversation {
  id: string
  status: 'WAITING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  visitor: {
    id: string
    name?: string
    email?: string
  }
  assignedUser?: {
    id: string
    name: string
  }
  messages: Message[]
  _count: {
    messages: number
  }
  startedAt: string
  updatedAt: string
}

interface ConversationListProps {
  onSelectConversation?: (conversation: Conversation) => void
  selectedConversationId?: string
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'assigned'>('all')

  useEffect(() => {
    fetchConversations()
  }, [filter])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId: 'demo-org-123', // TODO: Get from auth context
        ...(filter !== 'all' && { status: filter.toUpperCase() })
      })

      const response = await fetch(`/api/conversations?${params}`)
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'RESOLVED': return 'bg-blue-100 text-blue-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return null
    }
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[0]
    if (!lastMessage) return 'No messages yet'
    
    const prefix = lastMessage.senderType === 'VISITOR' ? '👤' : 
                   lastMessage.senderType === 'AGENT' ? '🧑‍💼' : '🤖'
    
    return `${prefix} ${lastMessage.content.slice(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`
  }

  const filteredConversations = conversations.filter(conv => {
    switch (filter) {
      case 'waiting': return conv.status === 'WAITING'
      case 'active': return conv.status === 'ACTIVE'
      case 'assigned': return conv.assignedUser !== null
      default: return true
    }
  })

  return (
    <div className="h-full flex flex-col">
      {/* Filter tabs */}
      <div className="p-4 border-b">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'waiting', label: 'Waiting' },
            { key: 'active', label: 'Active' },
            { key: 'assigned', label: 'Assigned' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
              className="text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations found
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedConversationId === conversation.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onSelectConversation?.(conversation)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getPriorityIcon(conversation.priority)}
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {conversation.visitor.name || conversation.visitor.email || 'Anonymous Visitor'}
                      </p>
                      {conversation.visitor.email && conversation.visitor.name && (
                        <p className="text-xs text-gray-500">{conversation.visitor.email}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </Badge>
                </div>

                <div className="mb-2">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {getLastMessage(conversation)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{conversation._count.messages}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  {conversation.assignedUser && (
                    <div className="flex items-center space-x-1">
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">
                          {conversation.assignedUser.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Refresh button */}
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchConversations}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  )
}