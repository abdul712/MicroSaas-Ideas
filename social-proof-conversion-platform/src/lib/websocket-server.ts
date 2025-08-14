import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from './prisma';
import redis from './redis';

export interface WidgetSocket extends Socket {
  apiKey?: string;
  organizationId?: string;
  visitorId?: string;
}

class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients = new Map<string, Set<WidgetSocket>>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      path: '/socket.io/',
    });

    this.setupEventHandlers();
    this.setupRedisSubscription();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: WidgetSocket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_widget', async (data) => {
        await this.handleJoinWidget(socket, data);
      });

      socket.on('track_event', async (data) => {
        await this.handleTrackEvent(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  private async handleJoinWidget(socket: WidgetSocket, data: any) {
    try {
      const { apiKey, visitorId, visitorData } = data;

      if (!apiKey || !apiKey.startsWith('sp_')) {
        socket.emit('error', { message: 'Invalid API key' });
        return;
      }

      // Verify API key and get organization
      const organization = await prisma.organization.findUnique({
        where: { apiKey },
      });

      if (!organization) {
        socket.emit('error', { message: 'Organization not found' });
        return;
      }

      socket.apiKey = apiKey;
      socket.organizationId = organization.id;
      socket.visitorId = visitorId;

      // Join organization room
      socket.join(`org_${organization.id}`);

      // Track client connection
      if (!this.connectedClients.has(organization.id)) {
        this.connectedClients.set(organization.id, new Set());
      }
      this.connectedClients.get(organization.id)!.add(socket);

      // Store visitor session data
      if (visitorId && visitorData) {
        await this.storeVisitorSession(organization.id, visitorId, visitorData);
      }

      // Send initial data
      const recentNotifications = await this.getRecentNotifications(organization.id);
      socket.emit('initial_data', {
        notifications: recentNotifications,
        visitorCount: await this.getVisitorCount(organization.id),
      });

      console.log(`Widget connected for org: ${organization.id}`);
    } catch (error) {
      console.error('Error handling join_widget:', error);
      socket.emit('error', { message: 'Internal server error' });
    }
  }

  private async handleTrackEvent(socket: WidgetSocket, data: any) {
    try {
      if (!socket.organizationId || !socket.visitorId) {
        return;
      }

      const { eventType, pageUrl, customData } = data;

      // Store event data
      await prisma.event.create({
        data: {
          organizationId: socket.organizationId,
          type: eventType.toUpperCase(),
          data: customData || {},
          visitorId: socket.visitorId,
          pageUrl,
        },
      });

      // Update visitor activity
      await this.updateVisitorActivity(socket.organizationId, socket.visitorId, eventType);

      // Broadcast visitor count updates
      this.broadcastVisitorCount(socket.organizationId);
    } catch (error) {
      console.error('Error handling track_event:', error);
    }
  }

  private handleDisconnect(socket: WidgetSocket) {
    console.log('Client disconnected:', socket.id);

    if (socket.organizationId) {
      const clients = this.connectedClients.get(socket.organizationId);
      if (clients) {
        clients.delete(socket);
        if (clients.size === 0) {
          this.connectedClients.delete(socket.organizationId);
        }
      }

      // Broadcast updated visitor count
      this.broadcastVisitorCount(socket.organizationId);
    }
  }

  private setupRedisSubscription() {
    const subscriber = redis.duplicate();
    
    subscriber.psubscribe('notifications:*', (error, count) => {
      if (error) {
        console.error('Redis subscription error:', error);
        return;
      }
      console.log(`Subscribed to ${count} Redis channels`);
    });

    subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const organizationId = channel.split(':')[1];
        const notificationData = JSON.parse(message);
        
        this.broadcastNotification(organizationId, notificationData);
      } catch (error) {
        console.error('Error processing Redis message:', error);
      }
    });
  }

  private async storeVisitorSession(organizationId: string, visitorId: string, visitorData: any) {
    const sessionKey = `visitor:${organizationId}:${visitorId}`;
    await redis.hset(sessionKey, {
      ...visitorData,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
    });
    await redis.expire(sessionKey, 1800); // 30 minutes

    // Add to organization's active visitors set
    const visitorsKey = `active_visitors:${organizationId}`;
    await redis.sadd(visitorsKey, visitorId);
    await redis.expire(visitorsKey, 1800);
  }

  private async updateVisitorActivity(organizationId: string, visitorId: string, eventType: string) {
    const sessionKey = `visitor:${organizationId}:${visitorId}`;
    await redis.hset(sessionKey, {
      lastSeen: Date.now(),
      lastEventType: eventType,
    });
  }

  private async getVisitorCount(organizationId: string): Promise<number> {
    const visitorsKey = `active_visitors:${organizationId}`;
    return await redis.scard(visitorsKey);
  }

  private async getRecentNotifications(organizationId: string) {
    return await prisma.event.findMany({
      where: {
        organizationId,
        type: {
          in: ['PURCHASE', 'SIGNUP', 'REVIEW_SUBMITTED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  private broadcastNotification(organizationId: string, notification: any) {
    this.io.to(`org_${organizationId}`).emit('notification', notification);
    console.log(`Broadcasted notification to org: ${organizationId}`);
  }

  private async broadcastVisitorCount(organizationId: string) {
    const count = await this.getVisitorCount(organizationId);
    this.io.to(`org_${organizationId}`).emit('visitor_count', {
      count,
      timestamp: new Date().toISOString(),
    });
  }

  // Public methods for external use
  public async sendNotificationToOrganization(organizationId: string, notification: any) {
    this.broadcastNotification(organizationId, notification);
  }

  public getConnectedClients(organizationId: string): number {
    return this.connectedClients.get(organizationId)?.size || 0;
  }

  public async getOrganizationStats(organizationId: string) {
    const connectedClients = this.getConnectedClients(organizationId);
    const visitorCount = await this.getVisitorCount(organizationId);
    
    return {
      connectedWidgets: connectedClients,
      activeVisitors: visitorCount,
    };
  }
}

let wsServer: WebSocketServer;

export function initializeWebSocketServer(server: HTTPServer): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer {
  return wsServer;
}