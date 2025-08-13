import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export interface ServerToClientEvents {
  message_received: (data: {
    message: any
    conversationId: string
    organizationId: string
  }) => void
  conversation_updated: (data: {
    conversation: any
    organizationId: string
  }) => void
  agent_status_changed: (data: {
    userId: string
    status: string
    organizationId: string
  }) => void
  typing_started: (data: {
    conversationId: string
    senderId: string
    senderType: string
  }) => void
  typing_stopped: (data: {
    conversationId: string
    senderId: string
    senderType: string
  }) => void
  visitor_online: (data: {
    visitorId: string
    organizationId: string
  }) => void
  visitor_offline: (data: {
    visitorId: string
    organizationId: string
  }) => void
}

export interface ClientToServerEvents {
  join_conversation: (data: {
    conversationId: string
    userId?: string
    userType: 'agent' | 'visitor'
    organizationId: string
  }) => void
  leave_conversation: (data: {
    conversationId: string
  }) => void
  send_message: (data: {
    conversationId: string
    content: string
    senderId?: string
    senderType: 'VISITOR' | 'AGENT' | 'SYSTEM'
    messageType?: string
    attachments?: any[]
    metadata?: Record<string, any>
  }) => void
  start_typing: (data: {
    conversationId: string
    senderId: string
    senderType: 'VISITOR' | 'AGENT'
  }) => void
  stop_typing: (data: {
    conversationId: string
    senderId: string
    senderType: 'VISITOR' | 'AGENT'
  }) => void
  update_agent_status: (data: {
    userId: string
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
    organizationId: string
  }) => void
  visitor_connected: (data: {
    visitorId: string
    organizationId: string
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  organizationId?: string
  userType?: 'agent' | 'visitor'
  conversationIds?: string[]
}

export function createSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const organizationId = socket.handshake.auth.organizationId
      const userType = socket.handshake.auth.userType

      if (!organizationId || !userType) {
        throw new Error('Organization ID and user type are required')
      }

      // For agents, verify JWT token
      if (userType === 'agent' && token) {
        // TODO: Add JWT verification logic
        const decoded = { userId: token } // Placeholder
        socket.data.userId = decoded.userId
      }

      socket.data.organizationId = organizationId
      socket.data.userType = userType
      socket.data.conversationIds = []

      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Join conversation room
    socket.on('join_conversation', async (data) => {
      try {
        const room = `conversation:${data.conversationId}`
        await socket.join(room)
        
        if (!socket.data.conversationIds) {
          socket.data.conversationIds = []
        }
        socket.data.conversationIds.push(data.conversationId)

        console.log(`Socket ${socket.id} joined conversation ${data.conversationId}`)

        // If agent joins, update conversation assignment
        if (socket.data.userType === 'agent' && data.userId) {
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: {
              assignedUserId: data.userId,
              status: 'ACTIVE'
            }
          })

          // Notify organization room about conversation update
          const orgRoom = `organization:${data.organizationId}`
          socket.to(orgRoom).emit('conversation_updated', {
            conversation: { 
              id: data.conversationId, 
              assignedUserId: data.userId,
              status: 'ACTIVE'
            },
            organizationId: data.organizationId
          })
        }
      } catch (error) {
        console.error('Error joining conversation:', error)
      }
    })

    // Leave conversation room
    socket.on('leave_conversation', async (data) => {
      try {
        const room = `conversation:${data.conversationId}`
        await socket.leave(room)
        
        if (socket.data.conversationIds) {
          socket.data.conversationIds = socket.data.conversationIds.filter(
            id => id !== data.conversationId
          )
        }

        console.log(`Socket ${socket.id} left conversation ${data.conversationId}`)
      } catch (error) {
        console.error('Error leaving conversation:', error)
      }
    })

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        // Create message in database
        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderType: data.senderType,
            content: data.content,
            messageType: data.messageType || 'TEXT',
            attachments: data.attachments || [],
            metadata: data.metadata || {},
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        })

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() }
        })

        // Emit to conversation room
        const room = `conversation:${data.conversationId}`
        io.to(room).emit('message_received', {
          message,
          conversationId: data.conversationId,
          organizationId: socket.data.organizationId!
        })

        // Cache recent messages in Redis
        const cacheKey = `messages:${data.conversationId}`
        await redis.lpush(cacheKey, JSON.stringify(message))
        await redis.ltrim(cacheKey, 0, 99) // Keep last 100 messages
        await redis.expire(cacheKey, 86400) // 24 hours

        console.log(`Message sent in conversation ${data.conversationId}`)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    })

    // Handle typing indicators
    socket.on('start_typing', (data) => {
      const room = `conversation:${data.conversationId}`
      socket.to(room).emit('typing_started', data)
    })

    socket.on('stop_typing', (data) => {
      const room = `conversation:${data.conversationId}`
      socket.to(room).emit('typing_stopped', data)
    })

    // Handle agent status updates
    socket.on('update_agent_status', async (data) => {
      try {
        if (socket.data.userType !== 'agent') return

        await prisma.user.update({
          where: { id: data.userId },
          data: { 
            status: data.status,
            lastActiveAt: new Date()
          }
        })

        // Emit to organization room
        const orgRoom = `organization:${data.organizationId}`
        socket.to(orgRoom).emit('agent_status_changed', data)

        console.log(`Agent ${data.userId} status updated to ${data.status}`)
      } catch (error) {
        console.error('Error updating agent status:', error)
      }
    })

    // Handle visitor connection
    socket.on('visitor_connected', (data) => {
      const orgRoom = `organization:${data.organizationId}`
      socket.to(orgRoom).emit('visitor_online', data)
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`)
      
      try {
        // Update agent status if agent disconnects
        if (socket.data.userType === 'agent' && socket.data.userId) {
          await prisma.user.update({
            where: { id: socket.data.userId },
            data: { 
              status: 'OFFLINE',
              lastActiveAt: new Date()
            }
          })

          const orgRoom = `organization:${socket.data.organizationId}`
          socket.to(orgRoom).emit('agent_status_changed', {
            userId: socket.data.userId,
            status: 'OFFLINE',
            organizationId: socket.data.organizationId!
          })
        }

        // Emit visitor offline if visitor disconnects
        if (socket.data.userType === 'visitor') {
          const orgRoom = `organization:${socket.data.organizationId}`
          socket.to(orgRoom).emit('visitor_offline', {
            visitorId: socket.data.userId || socket.id,
            organizationId: socket.data.organizationId!
          })
        }
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    })
  })

  return io
}

export type SocketServer = ReturnType<typeof createSocketServer>