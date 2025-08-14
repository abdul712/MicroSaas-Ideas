import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

let io: SocketIOServer | null = null

export function initializeSocket(server: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return next(new Error('Authentication failed'))
      }
      
      socket.data.user = session.user
      socket.data.organizationId = session.user.organizationId
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    const organizationId = socket.data.organizationId

    console.log(`User ${user.email} connected to organization ${organizationId}`)

    // Join organization room
    socket.join(`org:${organizationId}`)

    // Join user's personal room
    socket.join(`user:${user.id}`)

    // Handle ticket updates
    socket.on('ticket:subscribe', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`)
    })

    socket.on('ticket:unsubscribe', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`)
    })

    // Handle live chat
    socket.on('chat:join', (chatId: string) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on('chat:leave', (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })

    socket.on('chat:message', async (data) => {
      try {
        const { chatId, message, recipientId } = data

        // Save message to database
        const savedMessage = await prisma.comment.create({
          data: {
            content: message,
            type: 'PUBLIC',
            ticketId: chatId,
            authorId: user.id,
          },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        })

        // Emit to chat room
        io?.to(`chat:${chatId}`).emit('chat:message', {
          id: savedMessage.id,
          message: savedMessage.content,
          author: savedMessage.author,
          timestamp: savedMessage.createdAt,
        })

        // Notify specific user if mentioned
        if (recipientId) {
          io?.to(`user:${recipientId}`).emit('notification', {
            type: 'chat_message',
            title: 'New chat message',
            message: `${user.name} sent you a message`,
            chatId,
          })
        }
      } catch (error) {
        console.error('Error handling chat message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('chat:typing', (data) => {
      const { chatId, isTyping } = data
      socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId: user.id,
        userName: user.name,
        isTyping,
      })
    })

    // Handle agent status updates
    socket.on('agent:status', (status: 'available' | 'busy' | 'away') => {
      // Update user status in database
      prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...user.preferences,
            status,
            lastSeen: new Date(),
          },
        },
      }).catch(console.error)

      // Notify organization members
      socket.to(`org:${organizationId}`).emit('agent:status_update', {
        userId: user.id,
        userName: user.name,
        status,
      })
    })

    // Handle ticket status changes
    socket.on('ticket:status_change', async (data) => {
      try {
        const { ticketId, newStatus, comment } = data

        // Update ticket status
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: newStatus },
          include: {
            assignedAgent: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            type: 'STATUS_CHANGED',
            description: `Status changed to ${newStatus}`,
            ticketId,
            userId: user.id,
            metadata: { oldStatus: data.oldStatus, newStatus },
          },
        })

        // Add comment if provided
        if (comment) {
          await prisma.comment.create({
            data: {
              content: comment,
              type: 'INTERNAL',
              ticketId,
              authorId: user.id,
            },
          })
        }

        // Notify all subscribers to this ticket
        io?.to(`ticket:${ticketId}`).emit('ticket:updated', {
          ticketId,
          status: newStatus,
          updatedBy: user.name,
        })

        // Notify organization about ticket update
        io?.to(`org:${organizationId}`).emit('ticket:status_changed', {
          ticketId,
          ticketNumber: updatedTicket.ticketNumber,
          newStatus,
          updatedBy: user.name,
        })
      } catch (error) {
        console.error('Error updating ticket status:', error)
        socket.emit('error', { message: 'Failed to update ticket status' })
      }
    })

    // Handle assignment changes
    socket.on('ticket:assign', async (data) => {
      try {
        const { ticketId, assigneeId } = data

        const updatedTicket = await prisma.ticket.update({
          where: { id: ticketId },
          data: { assignedAgentId: assigneeId },
          include: {
            assignedAgent: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        // Create activity log
        await prisma.activity.create({
          data: {
            type: 'ASSIGNED',
            description: `Ticket assigned to ${updatedTicket.assignedAgent?.name}`,
            ticketId,
            userId: user.id,
          },
        })

        // Notify the assigned agent
        if (assigneeId) {
          io?.to(`user:${assigneeId}`).emit('notification', {
            type: 'ticket_assigned',
            title: 'New ticket assigned',
            message: `You have been assigned to ticket ${updatedTicket.ticketNumber}`,
            ticketId,
          })
        }

        // Notify ticket subscribers
        io?.to(`ticket:${ticketId}`).emit('ticket:assigned', {
          ticketId,
          assignee: updatedTicket.assignedAgent,
          assignedBy: user.name,
        })
      } catch (error) {
        console.error('Error assigning ticket:', error)
        socket.emit('error', { message: 'Failed to assign ticket' })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user.email} disconnected`)
      
      // Update last seen
      prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...user.preferences,
            lastSeen: new Date(),
          },
        },
      }).catch(console.error)

      // Notify organization about user going offline
      socket.to(`org:${organizationId}`).emit('agent:status_update', {
        userId: user.id,
        userName: user.name,
        status: 'offline',
      })
    })
  })

  return io
}

export function getSocketIO(): SocketIOServer | null {
  return io
}

// Utility functions for emitting events
export function emitToOrganization(organizationId: string, event: string, data: any) {
  if (io) {
    io.to(`org:${organizationId}`).emit(event, data)
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
  }
}

export function emitToTicket(ticketId: string, event: string, data: any) {
  if (io) {
    io.to(`ticket:${ticketId}`).emit(event, data)
  }
}