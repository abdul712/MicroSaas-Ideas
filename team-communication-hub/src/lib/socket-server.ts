import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verify } from 'jsonwebtoken';
import { prisma, updateUserPresence, createMessage, logActivity } from './prisma';
import { checkChannelAccess } from './auth';
import { sanitizeMessage, extractMentions, debounce } from './utils';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents,
  MessageData,
  PresenceData,
  TypingIndicator 
} from '@/types';

interface SocketData {
  userId: string;
  username: string;
  teamId?: string;
}

export class SocketManager {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private channelSockets = new Map<string, Set<string>>(); // channelId -> Set of socketIds
  private typingUsers = new Map<string, Map<string, NodeJS.Timeout>>(); // channelId -> userId -> timeout

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as any;
        
        if (!decoded.userId) {
          return next(new Error('Invalid token'));
        }

        // Get user data
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            status: true,
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.userId = user.id;
        socket.data.username = user.username;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.data.username} connected`);
      
      this.handleUserConnection(socket);
      this.handleMessageEvents(socket);
      this.handleChannelEvents(socket);
      this.handlePresenceEvents(socket);
      this.handleTypingEvents(socket);
      this.handleDisconnection(socket);
    });
  }

  private handleUserConnection(socket: any) {
    const userId = socket.data.userId;
    
    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // Update user presence to online
    this.updatePresence(userId, 'ONLINE');

    // Join user to their teams' rooms
    this.joinUserTeamRooms(socket, userId);
  }

  private async joinUserTeamRooms(socket: any, userId: string) {
    try {
      const teamMemberships = await prisma.teamMember.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          team: {
            include: {
              channels: {
                where: {
                  isArchived: false,
                  OR: [
                    { type: 'PUBLIC' },
                    {
                      type: 'PRIVATE',
                      members: {
                        some: { userId },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });

      for (const membership of teamMemberships) {
        // Join team room
        socket.join(`team:${membership.team.id}`);
        
        // Join accessible channels
        for (const channel of membership.team.channels) {
          socket.join(`channel:${channel.id}`);
          
          // Track channel socket
          if (!this.channelSockets.has(channel.id)) {
            this.channelSockets.set(channel.id, new Set());
          }
          this.channelSockets.get(channel.id)!.add(socket.id);
        }
      }
    } catch (error) {
      console.error('Error joining team rooms:', error);
    }
  }

  private handleMessageEvents(socket: any) {
    socket.on('message:send', async (channelId: string, content: string, threadId?: string) => {
      try {
        const userId = socket.data.userId;
        
        // Verify channel access
        const hasAccess = await checkChannelAccess(userId, channelId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Get channel and team info
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: { teamId: true },
        });

        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Validate and sanitize content
        if (!content || content.trim().length === 0 || content.length > 4000) {
          socket.emit('error', { message: 'Invalid message content' });
          return;
        }

        const sanitizedContent = sanitizeMessage(content.trim());
        const mentions = extractMentions(sanitizedContent);

        // Create message
        const message = await createMessage({
          content: sanitizedContent,
          senderId: userId,
          channelId,
          teamId: channel.teamId,
          threadId,
          type: 'TEXT',
        });

        // Handle mentions
        if (mentions.length > 0) {
          const mentionUsers = await prisma.user.findMany({
            where: { username: { in: mentions } },
            select: { id: true },
          });

          if (mentionUsers.length > 0) {
            await prisma.messageMention.createMany({
              data: mentionUsers.map(user => ({
                messageId: message.id,
                userId: user.id,
              })),
            });
          }
        }

        // Broadcast to channel
        const messageData: MessageData = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          channelId: message.channelId,
          threadId: message.threadId,
          type: message.type,
          isEdited: message.isEdited,
          editedAt: message.editedAt,
          createdAt: message.createdAt,
          sender: {
            id: message.sender.id,
            username: message.sender.username,
            displayName: message.sender.displayName,
            avatarUrl: message.sender.avatarUrl,
            status: message.sender.status,
            lastActiveAt: message.sender.lastActiveAt,
          },
          reactions: [],
          attachments: [],
          mentions,
        };

        this.io.to(`channel:${channelId}`).emit('message:new', messageData);

        // Log activity
        await logActivity({
          userId,
          teamId: channel.teamId,
          action: 'MESSAGE_SENT',
          resourceType: 'message',
          resourceId: message.id,
          metadata: { channelId, threadId, mentions },
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:edit', async (messageId: string, content: string) => {
      try {
        const userId = socket.data.userId;
        
        // Verify message ownership
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            senderId: userId,
            isDeleted: false,
          },
          include: {
            channel: true,
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                lastActiveAt: true,
              },
            },
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or access denied' });
          return;
        }

        // Validate content
        if (!content || content.trim().length === 0 || content.length > 4000) {
          socket.emit('error', { message: 'Invalid message content' });
          return;
        }

        const sanitizedContent = sanitizeMessage(content.trim());

        // Update message
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            content: sanitizedContent,
            isEdited: true,
            editedAt: new Date(),
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                lastActiveAt: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });

        const messageData: MessageData = {
          id: updatedMessage.id,
          content: updatedMessage.content,
          senderId: updatedMessage.senderId,
          channelId: updatedMessage.channelId,
          threadId: updatedMessage.threadId,
          type: updatedMessage.type,
          isEdited: updatedMessage.isEdited,
          editedAt: updatedMessage.editedAt,
          createdAt: updatedMessage.createdAt,
          sender: updatedMessage.sender,
          reactions: updatedMessage.reactions.map(reaction => ({
            id: reaction.id,
            emoji: reaction.emoji,
            userId: reaction.userId,
            user: reaction.user,
            createdAt: reaction.createdAt,
          })),
          attachments: [],
          mentions: extractMentions(sanitizedContent),
        };

        this.io.to(`channel:${message.channelId}`).emit('message:updated', messageData);

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('message:delete', async (messageId: string) => {
      try {
        const userId = socket.data.userId;
        
        // Verify message ownership or admin permissions
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            isDeleted: false,
          },
          include: {
            channel: {
              include: {
                team: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const isOwner = message.senderId === userId;
        const isAdmin = message.channel.team.members[0]?.role === 'ADMIN' || 
                       message.channel.team.members[0]?.role === 'OWNER';

        if (!isOwner && !isAdmin) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Soft delete message
        await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            content: '[deleted]',
          },
        });

        this.io.to(`channel:${message.channelId}`).emit('message:deleted', messageId);

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('message:react', async (messageId: string, emoji: string) => {
      try {
        const userId = socket.data.userId;
        
        // Validate emoji
        if (!emoji || emoji.length > 10) {
          socket.emit('error', { message: 'Invalid emoji' });
          return;
        }

        // Check if reaction already exists
        const existingReaction = await prisma.messageReaction.findFirst({
          where: {
            messageId,
            userId,
            emoji,
          },
        });

        if (existingReaction) {
          // Remove reaction
          await prisma.messageReaction.delete({
            where: { id: existingReaction.id },
          });
        } else {
          // Add reaction
          const reaction = await prisma.messageReaction.create({
            data: {
              messageId,
              userId,
              emoji,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          });

          this.io.to(`channel:${messageId}`).emit('message:reaction', messageId, {
            id: reaction.id,
            emoji: reaction.emoji,
            userId: reaction.userId,
            user: reaction.user,
            createdAt: reaction.createdAt,
          });
        }

      } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', { message: 'Failed to handle reaction' });
      }
    });
  }

  private handleChannelEvents(socket: any) {
    socket.on('channel:join', async (channelId: string) => {
      try {
        const userId = socket.data.userId;
        
        const hasAccess = await checkChannelAccess(userId, channelId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`channel:${channelId}`);
        
        if (!this.channelSockets.has(channelId)) {
          this.channelSockets.set(channelId, new Set());
        }
        this.channelSockets.get(channelId)!.add(socket.id);

      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      
      const channelSockets = this.channelSockets.get(channelId);
      if (channelSockets) {
        channelSockets.delete(socket.id);
        if (channelSockets.size === 0) {
          this.channelSockets.delete(channelId);
        }
      }
    });
  }

  private handlePresenceEvents(socket: any) {
    socket.on('user:presence', async (status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE', activity?: string) => {
      try {
        const userId = socket.data.userId;
        await this.updatePresence(userId, status, activity);
        
        // Broadcast presence update to all teams user is member of
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.forEach(socketId => {
            const userSocket = this.io.sockets.sockets.get(socketId);
            if (userSocket) {
              userSocket.rooms.forEach(room => {
                if (room.startsWith('team:')) {
                  this.io.to(room).emit('user:presence', {
                    userId,
                    status,
                    activity,
                    lastSeen: new Date(),
                  });
                }
              });
            }
          });
        }

      } catch (error) {
        console.error('Error updating presence:', error);
      }
    });
  }

  private handleTypingEvents(socket: any) {
    const debouncedStopTyping = debounce((channelId: string, userId: string) => {
      this.stopTyping(channelId, userId);
    }, 1000);

    socket.on('user:typing', (channelId: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;
      
      // Clear existing timeout
      const channelTyping = this.typingUsers.get(channelId);
      if (channelTyping?.has(userId)) {
        clearTimeout(channelTyping.get(userId)!);
      }

      // Set new timeout
      if (!this.typingUsers.has(channelId)) {
        this.typingUsers.set(channelId, new Map());
      }
      
      const timeout = setTimeout(() => {
        this.stopTyping(channelId, userId);
      }, 3000);
      
      this.typingUsers.get(channelId)!.set(userId, timeout);

      // Broadcast typing indicator
      socket.to(`channel:${channelId}`).emit('user:typing', {
        userId,
        channelId,
        username,
        timestamp: new Date(),
      });

      // Set up debounced stop typing
      debouncedStopTyping(channelId, userId);
    });

    socket.on('user:stop_typing', (channelId: string) => {
      const userId = socket.data.userId;
      this.stopTyping(channelId, userId);
    });
  }

  private stopTyping(channelId: string, userId: string) {
    const channelTyping = this.typingUsers.get(channelId);
    if (channelTyping?.has(userId)) {
      clearTimeout(channelTyping.get(userId)!);
      channelTyping.delete(userId);
      
      if (channelTyping.size === 0) {
        this.typingUsers.delete(channelId);
      }

      // Broadcast stop typing
      this.io.to(`channel:${channelId}`).emit('user:stopped_typing', userId, channelId);
    }
  }

  private handleDisconnection(socket: any) {
    socket.on('disconnect', async () => {
      try {
        const userId = socket.data.userId;
        console.log(`User ${socket.data.username} disconnected`);

        // Remove socket from tracking
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
            // User is fully offline
            await this.updatePresence(userId, 'OFFLINE');
          }
        }

        // Remove from channel sockets
        this.channelSockets.forEach((sockets, channelId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.channelSockets.delete(channelId);
          }
        });

        // Clear typing indicators
        this.typingUsers.forEach((users, channelId) => {
          if (users.has(userId)) {
            this.stopTyping(channelId, userId);
          }
        });

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  }

  private async updatePresence(userId: string, status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE', activity?: string) {
    try {
      await updateUserPresence(userId, status, activity);
      
      // Broadcast to all teams user is member of
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.forEach(socketId => {
          const userSocket = this.io.sockets.sockets.get(socketId);
          if (userSocket) {
            userSocket.rooms.forEach(room => {
              if (room.startsWith('team:')) {
                this.io.to(room).emit('user:presence', {
                  userId,
                  status,
                  activity,
                  lastSeen: new Date(),
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Admin methods
  public broadcastToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  public broadcastToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public getChannelUsers(channelId: string): string[] {
    const sockets = this.channelSockets.get(channelId);
    if (!sockets) return [];

    const users = new Set<string>();
    sockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket?.data?.userId) {
        users.add(socket.data.userId);
      }
    });

    return Array.from(users);
  }
}

export let socketManager: SocketManager;

export function initializeSocket(server: HTTPServer) {
  socketManager = new SocketManager(server);
  return socketManager;
}