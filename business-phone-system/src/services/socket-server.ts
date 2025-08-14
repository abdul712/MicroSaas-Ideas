import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId: string;
  organizationId: string;
}

export class WebRTCSignalingServer {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL : '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupNamespace();
  }

  private setupNamespace(): void {
    const webrtcNamespace = this.io.of('/webrtc');

    // Authentication middleware
    webrtcNamespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        const userId = decoded.sub || decoded.userId;

        // Verify user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true }
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('User not found or inactive'));
        }

        (socket as any).userId = user.id;
        (socket as any).organizationId = user.organizationId;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    webrtcNamespace.on('connection', (socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId } = socket;
    
    console.log(`User ${userId} connected to WebRTC signaling`);
    
    // Track connected user
    this.connectedUsers.set(userId, socket.id);

    // Update user extension status to available
    this.updateUserStatus(userId, 'AVAILABLE');

    // Handle call offers
    socket.on('call-offer', async (data) => {
      await this.handleCallOffer(socket, data);
    });

    // Handle call answers
    socket.on('call-answer', async (data) => {
      await this.handleCallAnswer(socket, data);
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
      this.forwardToUser(data.targetUserId || data.to, 'ice-candidate', data);
    });

    // Handle call termination
    socket.on('call-ended', async (data) => {
      await this.handleCallEnded(socket, data);
    });

    // Handle call hold
    socket.on('call-hold', (data) => {
      this.forwardToUser(data.targetUserId, 'call-hold', data);
    });

    // Handle presence updates
    socket.on('presence-update', async (data) => {
      await this.handlePresenceUpdate(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private async handleCallOffer(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callId, to: targetUserId, signal, metadata } = data;
      const { userId: fromUserId, organizationId } = socket;

      // Verify target user exists and is in same organization
      const targetUser = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          organizationId: organizationId,
          status: 'ACTIVE'
        },
        include: { extension: true }
      });

      if (!targetUser) {
        socket.emit('error', 'Target user not found or not available');
        return;
      }

      // Check if target user is available
      const targetExtension = targetUser.extension;
      if (!targetExtension || targetExtension.status === 'BUSY' || targetExtension.status === 'DO_NOT_DISTURB') {
        socket.emit('error', 'Target user is not available');
        return;
      }

      // Create call record
      const call = await prisma.call.create({
        data: {
          callId,
          direction: 'INTERNAL',
          status: 'RINGING',
          callType: metadata?.video ? 'VIDEO' : 'VOICE',
          fromNumber: socket.userId,
          toNumber: targetUserId,
          callerId: socket.userId,
          receiverId: targetUserId,
          organizationId: organizationId
        }
      });

      // Update extension status
      await this.updateUserStatus(targetUserId, 'BUSY');

      // Forward offer to target user
      const targetSocketId = this.connectedUsers.get(targetUserId);
      if (targetSocketId) {
        const targetSocket = this.io.of('/webrtc').sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('call-offer', {
            callId,
            from: fromUserId,
            to: targetUserId,
            signal,
            metadata
          });
        }
      } else {
        // User is offline, handle accordingly (e.g., voicemail)
        socket.emit('error', 'Target user is offline');
        await this.endCall(callId, 'NO_ANSWER');
      }

    } catch (error) {
      console.error('Error handling call offer:', error);
      socket.emit('error', 'Failed to process call offer');
    }
  }

  private async handleCallAnswer(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callId, signal } = data;

      // Update call status
      await prisma.call.update({
        where: { callId },
        data: { status: 'ANSWERED' }
      });

      // Forward answer to caller
      const call = await prisma.call.findUnique({
        where: { callId },
        include: { caller: true, receiver: true }
      });

      if (call?.caller) {
        const callerSocketId = this.connectedUsers.get(call.caller.id);
        if (callerSocketId) {
          const callerSocket = this.io.of('/webrtc').sockets.get(callerSocketId);
          callerSocket?.emit('call-answer', { callId, signal });
        }
      }

    } catch (error) {
      console.error('Error handling call answer:', error);
      socket.emit('error', 'Failed to process call answer');
    }
  }

  private async handleCallEnded(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { callId, reason } = data;
      await this.endCall(callId, reason);

      // Notify other participant
      const call = await prisma.call.findUnique({
        where: { callId },
        include: { caller: true, receiver: true }
      });

      if (call) {
        const otherUserId = call.callerId === socket.userId ? call.receiverId : call.callerId;
        if (otherUserId) {
          const otherSocketId = this.connectedUsers.get(otherUserId);
          if (otherSocketId) {
            const otherSocket = this.io.of('/webrtc').sockets.get(otherSocketId);
            otherSocket?.emit('call-ended', { callId, reason });
          }
          
          // Update extension status back to available
          await this.updateUserStatus(otherUserId, 'AVAILABLE');
        }
      }

    } catch (error) {
      console.error('Error handling call ended:', error);
    }
  }

  private async handlePresenceUpdate(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { status } = data;
      await this.updateUserStatus(socket.userId, status);
      
      // Notify team members about status change
      const user = await prisma.user.findUnique({
        where: { id: socket.userId },
        include: {
          teamMemberships: {
            include: {
              team: {
                include: {
                  members: {
                    include: { user: true }
                  }
                }
              }
            }
          }
        }
      });

      // Broadcast status to team members
      if (user?.teamMemberships) {
        const teamMemberIds = user.teamMemberships.flatMap(membership =>
          membership.team.members
            .filter(member => member.userId !== socket.userId)
            .map(member => member.userId)
        );

        teamMemberIds.forEach(memberId => {
          const memberSocketId = this.connectedUsers.get(memberId);
          if (memberSocketId) {
            const memberSocket = this.io.of('/webrtc').sockets.get(memberSocketId);
            memberSocket?.emit('presence-update', {
              userId: socket.userId,
              status
            });
          }
        });
      }

    } catch (error) {
      console.error('Error handling presence update:', error);
    }
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    console.log(`User ${socket.userId} disconnected from WebRTC signaling`);
    
    // Remove from connected users
    this.connectedUsers.delete(socket.userId);
    
    // Update user status to offline
    this.updateUserStatus(socket.userId, 'OFFLINE');
  }

  private async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      await prisma.extension.updateMany({
        where: { userId },
        data: { status: status as any }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  private async endCall(callId: string, reason: string): Promise<void> {
    try {
      const statusMap: { [key: string]: any } = {
        'answered': 'COMPLETED',
        'rejected': 'CANCELLED',
        'no_answer': 'NO_ANSWER',
        'busy': 'BUSY',
        'failed': 'FAILED'
      };

      const endTime = new Date();
      const call = await prisma.call.findUnique({
        where: { callId }
      });

      if (call) {
        const duration = call.startTime ? Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000) : 0;
        
        await prisma.call.update({
          where: { callId },
          data: {
            status: statusMap[reason] || 'FAILED',
            endTime,
            duration
          }
        });
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  private forwardToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.of('/webrtc').sockets.get(socketId);
      socket?.emit(event, data);
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Export for use in Next.js API routes
let signalingServer: WebRTCSignalingServer | null = null;

export function initializeSignalingServer(httpServer: any): WebRTCSignalingServer {
  if (!signalingServer) {
    signalingServer = new WebRTCSignalingServer(httpServer);
  }
  return signalingServer;
}

export function getSignalingServer(): WebRTCSignalingServer | null {
  return signalingServer;
}