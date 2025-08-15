import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { getToken } from 'next-auth/jwt'
import { prisma } from './prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export interface SocketUser {
  id: string
  username: string
  avatarUrl?: string
  teamIds: string[]
}

export interface ServerToClientEvents {
  'message:new': (message: any) => void
  'message:updated': (message: any) => void
  'message:deleted': (messageId: string) => void
  'typing:start': (data: { userId: string; username: string; channelId: string }) => void
  'typing:stop': (data: { userId: string; channelId: string }) => void
  'user:joined': (user: SocketUser) => void
  'user:left': (userId: string) => void
  'user:status': (data: { userId: string; status: string }) => void
  'channel:updated': (channel: any) => void
  'team:updated': (team: any) => void
  'notification': (notification: any) => void
}

export interface ClientToServerEvents {
  'message:send': (data: { channelId: string; content: string; type?: string; metadata?: any }) => void
  'message:edit': (data: { messageId: string; content: string }) => void
  'message:delete': (messageId: string) => void
  'typing:start': (channelId: string) => void
  'typing:stop': (channelId: string) => void
  'user:status': (status: string) => void
  'channel:join': (channelId: string) => void
  'channel:leave': (channelId: string) => void
  'team:join': (teamId: string) => void
  'team:leave': (teamId: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  user: SocketUser
}

export const initializeSocket = (
  req: NextApiRequest,
  res: NextApiResponseServerIO
) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')

    const io = new ServerIO<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = await getToken({
          req: socket.request as any,
          secret: process.env.NEXTAUTH_SECRET,
        })

        if (!token) {
          return next(new Error('Unauthorized'))
        }

        // Get user teams
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            teamMemberships: {
              where: { isActive: true },
              select: { teamId: true }
            }
          }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.user = {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl || undefined,
          teamIds: user.teamMemberships.map(tm => tm.teamId)
        }

        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    io.on('connection', (socket) => {
      const user = socket.data.user
      console.log(`User ${user.username} connected`)

      // Join user to their team rooms
      user.teamIds.forEach(teamId => {
        socket.join(`team:${teamId}`)
      })

      // Update user status to online
      prisma.user.update({
        where: { id: user.id },
        data: { status: 'ONLINE', lastSeenAt: new Date() }
      }).catch(console.error)

      // Notify team members that user is online
      user.teamIds.forEach(teamId => {
        socket.to(`team:${teamId}`).emit('user:joined', user)
      })

      // Handle typing indicators
      const typingUsers = new Map<string, NodeJS.Timeout>()

      socket.on('typing:start', (channelId) => {
        // Clear existing timeout
        const existingTimeout = typingUsers.get(channelId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // Emit typing start
        socket.to(`channel:${channelId}`).emit('typing:start', {
          userId: user.id,
          username: user.username,
          channelId
        })

        // Set timeout to auto-stop typing after 3 seconds
        const timeout = setTimeout(() => {
          socket.to(`channel:${channelId}`).emit('typing:stop', {
            userId: user.id,
            channelId
          })
          typingUsers.delete(channelId)
        }, 3000)

        typingUsers.set(channelId, timeout)
      })

      socket.on('typing:stop', (channelId) => {
        const existingTimeout = typingUsers.get(channelId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
          typingUsers.delete(channelId)
        }

        socket.to(`channel:${channelId}`).emit('typing:stop', {
          userId: user.id,
          channelId
        })
      })

      // Handle channel joining/leaving
      socket.on('channel:join', (channelId) => {
        socket.join(`channel:${channelId}`)
      })

      socket.on('channel:leave', (channelId) => {
        socket.leave(`channel:${channelId}`)
      })

      // Handle status updates
      socket.on('user:status', async (status) => {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: status as any }
          })

          user.teamIds.forEach(teamId => {
            socket.to(`team:${teamId}`).emit('user:status', {
              userId: user.id,
              status
            })
          })
        } catch (error) {
          console.error('Error updating user status:', error)
        }
      })

      // Handle message sending
      socket.on('message:send', async (data) => {
        try {
          const { channelId, content, type = 'TEXT', metadata } = data

          // Verify user has access to channel
          const channelMember = await prisma.channelMember.findFirst({
            where: {
              channelId,
              userId: user.id,
              isActive: true
            },
            include: {
              channel: {
                include: {
                  team: true
                }
              }
            }
          })

          if (!channelMember) {
            return // User doesn't have access
          }

          // Create message
          const message = await prisma.message.create({
            data: {
              content,
              type: type as any,
              metadata,
              channelId,
              authorId: user.id
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          })

          // Emit to channel
          io.to(`channel:${channelId}`).emit('message:new', message)

          // Log activity
          await prisma.activity.create({
            data: {
              type: 'MESSAGE_POSTED',
              data: {
                messageId: message.id,
                channelId,
                teamId: channelMember.channel.team.id
              },
              userId: user.id,
              teamId: channelMember.channel.team.id
            }
          })
        } catch (error) {
          console.error('Error sending message:', error)
        }
      })

      // Handle message editing
      socket.on('message:edit', async (data) => {
        try {
          const { messageId, content } = data

          const message = await prisma.message.findFirst({
            where: {
              id: messageId,
              authorId: user.id,
              isDeleted: false
            },
            include: {
              channel: true
            }
          })

          if (!message) {
            return // Message not found or user doesn't own it
          }

          const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
              content,
              isEdited: true,
              editedAt: new Date()
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          })

          io.to(`channel:${message.channelId}`).emit('message:updated', updatedMessage)
        } catch (error) {
          console.error('Error editing message:', error)
        }
      })

      // Handle message deletion
      socket.on('message:delete', async (messageId) => {
        try {
          const message = await prisma.message.findFirst({
            where: {
              id: messageId,
              authorId: user.id,
              isDeleted: false
            }
          })

          if (!message) {
            return // Message not found or user doesn't own it
          }

          await prisma.message.update({
            where: { id: messageId },
            data: {
              isDeleted: true,
              deletedAt: new Date()
            }
          })

          io.to(`channel:${message.channelId}`).emit('message:deleted', messageId)
        } catch (error) {
          console.error('Error deleting message:', error)
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User ${user.username} disconnected`)

        // Clear typing timeouts
        typingUsers.forEach(timeout => clearTimeout(timeout))
        typingUsers.clear()

        // Update user status to offline
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              status: 'OFFLINE',
              lastSeenAt: new Date()
            }
          })

          // Notify team members that user is offline
          user.teamIds.forEach(teamId => {
            socket.to(`team:${teamId}`).emit('user:left', user.id)
          })
        } catch (error) {
          console.error('Error updating user status on disconnect:', error)
        }
      })
    })

    res.socket.server.io = io
  }

  res.end()
}