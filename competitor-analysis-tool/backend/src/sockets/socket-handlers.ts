import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { config } from '../config/config'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface AuthenticatedSocket {
  userId: string
  organizationId: string
  email: string
  role: string
}

export function setupSocketHandlers(io: SocketServer) {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string
        organizationId: string
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })

      if (!user || user.status !== 'active' || user.organization.status !== 'active') {
        return next(new Error('Invalid or inactive user'))
      }

      // Attach user info to socket
      socket.data = {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role,
      } as AuthenticatedSocket

      next()

    } catch (error) {
      logger.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const userData = socket.data as AuthenticatedSocket
    
    logger.info(`Socket connected: ${userData.email} (${userData.userId})`)

    // Join organization room for organization-wide updates
    socket.join(`org:${userData.organizationId}`)
    
    // Join user-specific room for personal notifications
    socket.join(`user:${userData.userId}`)

    // Handle competitor monitoring subscriptions
    socket.on('subscribe:competitor', (competitorId: string) => {
      // Verify user has access to this competitor
      prisma.competitor.findFirst({
        where: {
          id: competitorId,
          organizationId: userData.organizationId,
        },
      }).then(competitor => {
        if (competitor) {
          socket.join(`competitor:${competitorId}`)
          socket.emit('subscribed:competitor', { competitorId })
          logger.info(`User ${userData.userId} subscribed to competitor ${competitorId}`)
        } else {
          socket.emit('error', { message: 'Competitor not found or access denied' })
        }
      }).catch(error => {
        logger.error('Error subscribing to competitor:', error)
        socket.emit('error', { message: 'Failed to subscribe to competitor' })
      })
    })

    socket.on('unsubscribe:competitor', (competitorId: string) => {
      socket.leave(`competitor:${competitorId}`)
      socket.emit('unsubscribed:competitor', { competitorId })
      logger.info(`User ${userData.userId} unsubscribed from competitor ${competitorId}`)
    })

    // Handle alert subscriptions
    socket.on('subscribe:alerts', () => {
      socket.join(`alerts:${userData.organizationId}`)
      socket.emit('subscribed:alerts')
    })

    socket.on('unsubscribe:alerts', () => {
      socket.leave(`alerts:${userData.organizationId}`)
      socket.emit('unsubscribed:alerts')
    })

    // Handle dashboard subscriptions for real-time metrics
    socket.on('subscribe:dashboard', () => {
      socket.join(`dashboard:${userData.organizationId}`)
      socket.emit('subscribed:dashboard')
    })

    socket.on('unsubscribe:dashboard', () => {
      socket.leave(`dashboard:${userData.organizationId}`)
      socket.emit('unsubscribed:dashboard')
    })

    // Handle scraping status subscriptions
    socket.on('subscribe:scraping', () => {
      socket.join(`scraping:${userData.organizationId}`)
      socket.emit('subscribed:scraping')
    })

    // Handle real-time typing indicators for collaborative features
    socket.on('typing:start', (data: { resource: string; resourceId: string }) => {
      socket.to(`org:${userData.organizationId}`).emit('typing:start', {
        userId: userData.userId,
        email: userData.email,
        ...data,
      })
    })

    socket.on('typing:stop', (data: { resource: string; resourceId: string }) => {
      socket.to(`org:${userData.organizationId}`).emit('typing:stop', {
        userId: userData.userId,
        email: userData.email,
        ...data,
      })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${userData.email} (${userData.userId}) - Reason: ${reason}`)
    })

    // Send initial connection confirmation
    socket.emit('connected', {
      message: 'Connected to Competitor Analysis Platform',
      userId: userData.userId,
      organizationId: userData.organizationId,
      timestamp: new Date().toISOString(),
    })
  })

  return io
}

// Helper functions to emit events from other parts of the application
export class SocketEventEmitter {
  private static io: SocketServer

  static setIO(ioInstance: SocketServer) {
    this.io = ioInstance
  }

  // Emit competitor-related events
  static emitCompetitorUpdate(competitorId: string, data: any) {
    if (this.io) {
      this.io.to(`competitor:${competitorId}`).emit('competitor:updated', {
        competitorId,
        data,
        timestamp: new Date().toISOString(),
      })
    }
  }

  static emitNewScrapedData(competitorId: string, organizationId: string, data: any) {
    if (this.io) {
      this.io.to(`competitor:${competitorId}`).emit('competitor:new_data', {
        competitorId,
        data,
        timestamp: new Date().toISOString(),
      })
      
      this.io.to(`dashboard:${organizationId}`).emit('dashboard:new_data', {
        competitorId,
        data,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit alert events
  static emitNewAlert(organizationId: string, alert: any) {
    if (this.io) {
      this.io.to(`alerts:${organizationId}`).emit('alert:new', {
        alert,
        timestamp: new Date().toISOString(),
      })
      
      this.io.to(`org:${organizationId}`).emit('notification:new', {
        type: 'alert',
        alert,
        timestamp: new Date().toISOString(),
      })
    }
  }

  static emitAlertUpdate(organizationId: string, alertId: string, data: any) {
    if (this.io) {
      this.io.to(`alerts:${organizationId}`).emit('alert:updated', {
        alertId,
        data,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit scraping status events
  static emitScrapingStatus(organizationId: string, status: any) {
    if (this.io) {
      this.io.to(`scraping:${organizationId}`).emit('scraping:status', {
        status,
        timestamp: new Date().toISOString(),
      })
    }
  }

  static emitScrapingComplete(competitorId: string, organizationId: string, result: any) {
    if (this.io) {
      this.io.to(`competitor:${competitorId}`).emit('scraping:complete', {
        competitorId,
        result,
        timestamp: new Date().toISOString(),
      })
      
      this.io.to(`scraping:${organizationId}`).emit('scraping:complete', {
        competitorId,
        result,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit system-wide notifications
  static emitSystemNotification(organizationId: string, notification: any) {
    if (this.io) {
      this.io.to(`org:${organizationId}`).emit('system:notification', {
        notification,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit user-specific notifications
  static emitUserNotification(userId: string, notification: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('user:notification', {
        notification,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit dashboard metrics updates
  static emitDashboardMetrics(organizationId: string, metrics: any) {
    if (this.io) {
      this.io.to(`dashboard:${organizationId}`).emit('dashboard:metrics', {
        metrics,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Emit bulk operation progress
  static emitBulkOperationProgress(organizationId: string, operation: any) {
    if (this.io) {
      this.io.to(`org:${organizationId}`).emit('bulk_operation:progress', {
        operation,
        timestamp: new Date().toISOString(),
      })
    }
  }
}