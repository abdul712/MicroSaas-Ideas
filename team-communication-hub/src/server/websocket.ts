import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { NextApiRequest } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redis, REDIS_KEYS, PresenceManager, TypingManager } from "@/lib/redis";
import { RateLimiter } from "@/lib/redis";

export interface CustomSocket extends Socket {
  userId?: string;
  teamIds?: string[];
  username?: string;
}

interface ServerToClientEvents {
  // Message events
  "message:new": (message: any) => void;
  "message:edit": (message: any) => void;
  "message:delete": (messageId: string) => void;
  "message:reaction": (data: { messageId: string; reaction: any }) => void;
  
  // Typing events
  "typing:start": (data: { channelId: string; userId: string; username: string }) => void;
  "typing:stop": (data: { channelId: string; userId: string }) => void;
  
  // User presence events
  "user:online": (userId: string) => void;
  "user:offline": (userId: string) => void;
  "user:status_change": (data: { userId: string; status: string }) => void;
  
  // Channel events
  "channel:join": (data: { channelId: string; user: any }) => void;
  "channel:leave": (data: { channelId: string; userId: string }) => void;
  "channel:update": (channel: any) => void;
  
  // Team events
  "team:member_join": (data: { teamId: string; member: any }) => void;
  "team:member_leave": (data: { teamId: string; userId: string }) => void;
  "team:update": (team: any) => void;
  
  // Direct message events
  "dm:new": (message: any) => void;
  "dm:edit": (message: any) => void;
  "dm:delete": (messageId: string) => void;
  
  // System events
  "notification": (notification: any) => void;
  "error": (error: { message: string; code?: string }) => void;
}

interface ClientToServerEvents {
  // Authentication
  "auth:authenticate": (token: string) => void;
  
  // Message events
  "message:send": (data: { channelId: string; content: string; type?: string; metadata?: any }) => void;
  "message:edit": (data: { messageId: string; content: string }) => void;
  "message:delete": (messageId: string) => void;
  "message:react": (data: { messageId: string; emoji: string }) => void;
  
  // Typing events
  "typing:start": (channelId: string) => void;
  "typing:stop": (channelId: string) => void;
  
  // Channel events
  "channel:join": (channelId: string) => void;
  "channel:leave": (channelId: string) => void;
  
  // User presence
  "user:status": (status: "online" | "away" | "busy" | "offline") => void;
  
  // Direct messages
  "dm:send": (data: { receiverId: string; content: string; teamId: string }) => void;
  "dm:edit": (data: { messageId: string; content: string }) => void;
  "dm:delete": (messageId: string) => void;
}

export class WebSocketManager {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  
  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: CustomSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authentication handler
      socket.on("auth:authenticate", async (token: string) => {
        try {
          // Verify the session token (you might need to adapt this based on your auth setup)
          const user = await this.authenticateSocket(socket, token);
          if (user) {
            socket.userId = user.id;
            socket.username = user.username || user.name;
            
            // Get user's teams
            const teamMemberships = await db.teamMember.findMany({
              where: { userId: user.id, status: "ACTIVE" },
              include: { team: true },
            });
            
            socket.teamIds = teamMemberships.map(tm => tm.team.id);
            
            // Join team rooms
            socket.teamIds.forEach(teamId => {
              socket.join(`team:${teamId}`);
            });
            
            // Set user online
            await PresenceManager.setUserOnline(user.id, {
              socketId: socket.id,
              username: socket.username,
            });
            
            // Store socket session
            await redis.sadd(REDIS_KEYS.SOCKET_SESSIONS(user.id), socket.id);
            
            // Notify team members that user is online
            socket.teamIds.forEach(teamId => {
              socket.to(`team:${teamId}`).emit("user:online", user.id);
            });
            
            console.log(`User authenticated: ${user.id} (${socket.username})`);
          }
        } catch (error) {
          console.error("Authentication error:", error);
          socket.emit("error", { message: "Authentication failed", code: "AUTH_ERROR" });
          socket.disconnect();
        }
      });

      // Message handlers
      socket.on("message:send", async (data) => {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated", code: "NOT_AUTHENTICATED" });
          return;
        }

        // Rate limiting
        const rateLimit = await RateLimiter.checkRateLimit(
          socket.userId,
          "message:send",
          30, // 30 messages
          60  // per minute
        );

        if (!rateLimit.allowed) {
          socket.emit("error", { 
            message: "Rate limit exceeded", 
            code: "RATE_LIMIT_EXCEEDED" 
          });
          return;
        }

        try {
          // Verify user can send messages to this channel
          const channelMember = await db.channelMember.findUnique({
            where: {
              channelId_userId: {
                channelId: data.channelId,
                userId: socket.userId,
              },
            },
            include: {
              channel: {
                include: {
                  team: true,
                },
              },
            },
          });

          if (!channelMember) {
            socket.emit("error", { message: "Access denied", code: "ACCESS_DENIED" });
            return;
          }

          // Create message
          const message = await db.message.create({
            data: {
              content: data.content,
              channelId: data.channelId,
              userId: socket.userId,
              type: (data.type as any) || "TEXT",
              metadata: data.metadata || {},
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                    },
                  },
                },
              },
              files: true,
            },
          });

          // Emit to channel members
          this.io.to(`channel:${data.channelId}`).emit("message:new", message);

          // Update channel last activity
          await db.channel.update({
            where: { id: data.channelId },
            data: { updatedAt: new Date() },
          });

        } catch (error) {
          console.error("Message send error:", error);
          socket.emit("error", { message: "Failed to send message", code: "MESSAGE_ERROR" });
        }
      });

      // Typing indicators
      socket.on("typing:start", async (channelId) => {
        if (!socket.userId || !socket.username) return;
        
        await TypingManager.setUserTyping(channelId, socket.userId);
        socket.to(`channel:${channelId}`).emit("typing:start", {
          channelId,
          userId: socket.userId,
          username: socket.username,
        });
      });

      socket.on("typing:stop", async (channelId) => {
        if (!socket.userId) return;
        
        await TypingManager.removeUserTyping(channelId, socket.userId);
        socket.to(`channel:${channelId}`).emit("typing:stop", {
          channelId,
          userId: socket.userId,
        });
      });

      // Channel management
      socket.on("channel:join", async (channelId) => {
        if (!socket.userId) return;

        try {
          // Verify user can join channel
          const channelMember = await db.channelMember.findUnique({
            where: {
              channelId_userId: {
                channelId,
                userId: socket.userId,
              },
            },
            include: {
              channel: true,
            },
          });

          if (channelMember) {
            socket.join(`channel:${channelId}`);
            
            // Emit join event to other channel members
            socket.to(`channel:${channelId}`).emit("channel:join", {
              channelId,
              user: {
                id: socket.userId,
                username: socket.username,
              },
            });
          }
        } catch (error) {
          console.error("Channel join error:", error);
        }
      });

      socket.on("channel:leave", async (channelId) => {
        if (!socket.userId) return;
        
        socket.leave(`channel:${channelId}`);
        socket.to(`channel:${channelId}`).emit("channel:leave", {
          channelId,
          userId: socket.userId,
        });
      });

      // User status updates
      socket.on("user:status", async (status) => {
        if (!socket.userId) return;

        try {
          await db.user.update({
            where: { id: socket.userId },
            data: { status: status.toUpperCase() as any },
          });

          await PresenceManager.setUserOnline(socket.userId, {
            status,
            socketId: socket.id,
            username: socket.username,
          });

          // Notify team members
          socket.teamIds?.forEach(teamId => {
            socket.to(`team:${teamId}`).emit("user:status_change", {
              userId: socket.userId!,
              status,
            });
          });
        } catch (error) {
          console.error("Status update error:", error);
        }
      });

      // Direct message handlers
      socket.on("dm:send", async (data) => {
        if (!socket.userId) return;

        try {
          // Verify both users are in the same team
          const teamMember = await db.teamMember.findFirst({
            where: {
              teamId: data.teamId,
              userId: data.receiverId,
              status: "ACTIVE",
            },
          });

          if (!teamMember) {
            socket.emit("error", { message: "User not found in team", code: "USER_NOT_FOUND" });
            return;
          }

          // Create direct message
          const dm = await db.directMessage.create({
            data: {
              content: data.content,
              senderId: socket.userId,
              receiverId: data.receiverId,
              teamId: data.teamId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          });

          // Send to receiver's sockets
          const receiverSockets = await redis.smembers(REDIS_KEYS.SOCKET_SESSIONS(data.receiverId));
          receiverSockets.forEach(socketId => {
            socket.to(socketId).emit("dm:new", dm);
          });

          // Send back to sender
          socket.emit("dm:new", dm);

        } catch (error) {
          console.error("DM send error:", error);
          socket.emit("error", { message: "Failed to send message", code: "DM_ERROR" });
        }
      });

      // Disconnect handler
      socket.on("disconnect", async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (socket.userId) {
          // Remove socket from user sessions
          await redis.srem(REDIS_KEYS.SOCKET_SESSIONS(socket.userId), socket.id);
          
          // Check if user has other active sockets
          const remainingSockets = await redis.scard(REDIS_KEYS.SOCKET_SESSIONS(socket.userId));
          
          if (remainingSockets === 0) {
            // Set user offline if no other sockets
            await PresenceManager.setUserOffline(socket.userId);
            await db.user.update({
              where: { id: socket.userId },
              data: { 
                status: "OFFLINE",
                lastSeen: new Date(),
              },
            });

            // Notify team members
            socket.teamIds?.forEach(teamId => {
              socket.to(`team:${teamId}`).emit("user:offline", socket.userId!);
            });
          }

          // Remove from typing indicators
          const typingKeys = await redis.keys(REDIS_KEYS.USER_TYPING("*", socket.userId));
          if (typingKeys.length > 0) {
            await redis.del(...typingKeys);
          }
        }
      });
    });
  }

  private async authenticateSocket(socket: CustomSocket, token: string): Promise<any> {
    try {
      // Here you would verify the JWT token or session
      // For now, we'll use a simple approach - in production, implement proper JWT verification
      
      // Try to get user from token (this is a simplified version)
      const user = await db.user.findFirst({
        where: { 
          // This is a placeholder - implement proper token verification
          id: token, // In reality, decode JWT and get user ID
        },
      });

      return user;
    } catch (error) {
      throw new Error("Invalid authentication token");
    }
  }

  // Utility methods for sending messages to specific users/channels
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  public sendToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  public getIO() {
    return this.io;
  }
}

// Export singleton instance
let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(httpServer);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}