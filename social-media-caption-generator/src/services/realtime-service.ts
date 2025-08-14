import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { NextApiRequest } from 'next';
import { prisma } from '@/lib/prisma';

// Types
export interface SocketUser {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  role: string;
}

export interface CollaborationSession {
  id: string;
  organizationId: string;
  name: string;
  activeUsers: SocketUser[];
  createdAt: Date;
  lastActivity: Date;
}

export interface GenerationProgress {
  sessionId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining?: number;
  results?: any[];
  error?: string;
}

export interface CaptionEvent {
  type: 'caption_generated' | 'caption_updated' | 'caption_liked' | 'caption_commented';
  captionId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface UserActivity {
  userId: string;
  action: 'viewing' | 'editing' | 'generating' | 'commenting';
  resource?: string;
  timestamp: Date;
}

// Real-time service class
export class RealTimeService {
  private static instance: RealTimeService;
  private io: SocketIOServer | null = null;
  private activeSessions = new Map<string, CollaborationSession>();
  private userSockets = new Map<string, Socket>();
  private generationSessions = new Map<string, GenerationProgress>();
  
  public static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  // Initialize Socket.IO server
  initialize(server: Server): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('Real-time service initialized');
  }

  // Setup socket event handlers
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const user = await this.authenticateSocket(token);
          if (user) {
            socket.data.user = user;
            this.userSockets.set(user.id, socket);
            
            // Join user-specific room
            socket.join(`user:${user.id}`);
            
            // Join organization room if applicable
            if (user.organizationId) {
              socket.join(`org:${user.organizationId}`);
            }
            
            socket.emit('authenticated', { user });
            console.log(`User authenticated: ${user.name} (${user.id})`);
          } else {
            socket.emit('authentication_failed');
            socket.disconnect();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_failed');
          socket.disconnect();
        }
      });

      // Join collaboration session
      socket.on('join_session', async (sessionId: string) => {
        if (!socket.data.user) return;
        
        try {
          const session = await this.joinCollaborationSession(sessionId, socket.data.user);
          socket.join(`session:${sessionId}`);
          
          // Notify other users
          socket.to(`session:${sessionId}`).emit('user_joined', {
            user: socket.data.user,
            session
          });
          
          socket.emit('session_joined', { session });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Leave collaboration session
      socket.on('leave_session', async (sessionId: string) => {
        if (!socket.data.user) return;
        
        await this.leaveCollaborationSession(sessionId, socket.data.user.id);
        socket.leave(`session:${sessionId}`);
        
        socket.to(`session:${sessionId}`).emit('user_left', {
          userId: socket.data.user.id
        });
      });

      // Real-time caption generation tracking
      socket.on('start_generation', (data: {
        prompt: string;
        platforms: string[];
        brandVoiceId?: string;
        imageUrl?: string;
      }) => {
        if (!socket.data.user) return;
        
        const generationId = `gen_${Date.now()}_${socket.data.user.id}`;
        this.trackGenerationProgress(generationId, socket.data.user.id, data);
        socket.emit('generation_started', { generationId });
      });

      // User activity tracking
      socket.on('user_activity', (activity: {
        action: string;
        resource?: string;
      }) => {
        if (!socket.data.user) return;
        
        this.broadcastUserActivity({
          userId: socket.data.user.id,
          action: activity.action as any,
          resource: activity.resource,
          timestamp: new Date()
        });
      });

      // Caption events
      socket.on('caption_updated', (data: {
        captionId: string;
        content: string;
        version: number;
      }) => {
        if (!socket.data.user) return;
        
        this.broadcastCaptionEvent({
          type: 'caption_updated',
          captionId: data.captionId,
          userId: socket.data.user.id,
          data,
          timestamp: new Date()
        });
      });

      // Live cursor/selection sharing
      socket.on('cursor_move', (data: {
        captionId: string;
        position: number;
        selection?: { start: number; end: number };
      }) => {
        if (!socket.data.user) return;
        
        socket.to(`caption:${data.captionId}`).emit('user_cursor', {
          userId: socket.data.user.id,
          user: socket.data.user,
          ...data
        });
      });

      // Typing indicators
      socket.on('typing_start', (captionId: string) => {
        if (!socket.data.user) return;
        
        socket.to(`caption:${captionId}`).emit('user_typing', {
          userId: socket.data.user.id,
          user: socket.data.user,
          typing: true
        });
      });

      socket.on('typing_stop', (captionId: string) => {
        if (!socket.data.user) return;
        
        socket.to(`caption:${captionId}`).emit('user_typing', {
          userId: socket.data.user.id,
          user: socket.data.user,
          typing: false
        });
      });

      // Disconnect handling
      socket.on('disconnect', async () => {
        if (socket.data.user) {
          console.log(`User disconnected: ${socket.data.user.name}`);
          this.userSockets.delete(socket.data.user.id);
          
          // Remove from all collaboration sessions
          for (const [sessionId, session] of this.activeSessions) {
            const userIndex = session.activeUsers.findIndex(u => u.id === socket.data.user.id);
            if (userIndex !== -1) {
              session.activeUsers.splice(userIndex, 1);
              socket.to(`session:${sessionId}`).emit('user_left', {
                userId: socket.data.user.id
              });
              
              // Clean up empty sessions
              if (session.activeUsers.length === 0) {
                this.activeSessions.delete(sessionId);
              }
            }
          }
        }
      });
    });
  }

  // Authenticate socket connection
  private async authenticateSocket(token: string): Promise<SocketUser | null> {
    try {
      // In a real implementation, verify JWT token
      // For now, we'll simulate token verification
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          organizations: {
            include: {
              organization: true
            }
          }
        }
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        organizationId: user.organizations[0]?.organization.id,
        role: user.role
      };
    } catch (error) {
      console.error('Token authentication failed:', error);
      return null;
    }
  }

  // Join collaboration session
  private async joinCollaborationSession(
    sessionId: string,
    user: SocketUser
  ): Promise<CollaborationSession> {
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        organizationId: user.organizationId || '',
        name: `Session ${sessionId}`,
        activeUsers: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.activeSessions.set(sessionId, session);
    }

    // Add user if not already present
    const existingUserIndex = session.activeUsers.findIndex(u => u.id === user.id);
    if (existingUserIndex === -1) {
      session.activeUsers.push(user);
    }

    session.lastActivity = new Date();
    return session;
  }

  // Leave collaboration session
  private async leaveCollaborationSession(sessionId: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const userIndex = session.activeUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        session.activeUsers.splice(userIndex, 1);
      }

      // Clean up empty sessions
      if (session.activeUsers.length === 0) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // Track generation progress
  public trackGenerationProgress(
    generationId: string,
    userId: string,
    data: any
  ): void {
    const progress: GenerationProgress = {
      sessionId: generationId,
      userId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing',
      totalSteps: 5,
      completedSteps: 0
    };

    this.generationSessions.set(generationId, progress);
  }

  // Update generation progress
  public updateGenerationProgress(
    generationId: string,
    updates: Partial<GenerationProgress>
  ): void {
    const progress = this.generationSessions.get(generationId);
    if (progress) {
      Object.assign(progress, updates);
      
      // Calculate progress percentage
      if (updates.completedSteps !== undefined && progress.totalSteps > 0) {
        progress.progress = Math.round((progress.completedSteps / progress.totalSteps) * 100);
      }

      // Broadcast to user
      this.emitToUser(progress.userId, 'generation_progress', progress);

      // Clean up completed sessions after delay
      if (progress.status === 'completed' || progress.status === 'failed') {
        setTimeout(() => {
          this.generationSessions.delete(generationId);
        }, 30000); // Clean up after 30 seconds
      }
    }
  }

  // Broadcast caption events
  private broadcastCaptionEvent(event: CaptionEvent): void {
    if (!this.io) return;

    // Broadcast to caption room
    this.io.to(`caption:${event.captionId}`).emit('caption_event', event);
    
    // Also broadcast to user's organization
    const userSocket = this.userSockets.get(event.userId);
    if (userSocket?.data.user?.organizationId) {
      this.io.to(`org:${userSocket.data.user.organizationId}`).emit('caption_event', event);
    }
  }

  // Broadcast user activity
  private broadcastUserActivity(activity: UserActivity): void {
    if (!this.io) return;

    const userSocket = this.userSockets.get(activity.userId);
    if (userSocket?.data.user?.organizationId) {
      userSocket.to(`org:${userSocket.data.user.organizationId}`).emit('user_activity', {
        ...activity,
        user: userSocket.data.user
      });
    }
  }

  // Emit to specific user
  public emitToUser(userId: string, event: string, data: any): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Emit to organization
  public emitToOrganization(organizationId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  // Emit to session
  public emitToSession(sessionId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`session:${sessionId}`).emit(event, data);
  }

  // Get active sessions
  public getActiveSessions(): CollaborationSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Get active users count
  public getActiveUsersCount(): number {
    return this.userSockets.size;
  }

  // Send notification to user
  public sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      action?: {
        label: string;
        url: string;
      };
    }
  ): void {
    this.emitToUser(userId, 'notification', {
      id: `notif_${Date.now()}`,
      ...notification,
      timestamp: new Date()
    });
  }

  // Broadcast system announcement
  public broadcastAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'maintenance' | 'feature' | 'warning' | 'info';
    targetUsers?: string[];
    organizationId?: string;
  }): void {
    if (!this.io) return;

    const data = {
      id: `announce_${Date.now()}`,
      ...announcement,
      timestamp: new Date()
    };

    if (announcement.organizationId) {
      this.io.to(`org:${announcement.organizationId}`).emit('announcement', data);
    } else if (announcement.targetUsers) {
      announcement.targetUsers.forEach(userId => {
        this.emitToUser(userId, 'announcement', data);
      });
    } else {
      this.io.emit('announcement', data);
    }
  }
}

export const realTimeService = RealTimeService.getInstance();