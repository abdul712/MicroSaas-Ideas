"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
  const [typingUsers, setTypingUsers] = useState(new Map<string, Set<string>>());

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001", {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      // Connection handlers
      newSocket.on("connect", () => {
        console.log("Connected to WebSocket server");
        setIsConnected(true);
        
        // Authenticate with server
        newSocket.emit("auth:authenticate", session.user.id);
        
        toast({
          title: "Connected",
          description: "Real-time messaging is now active",
          duration: 2000,
        });
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from WebSocket server:", reason);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
        
        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        setIsConnected(false);
        
        toast({
          title: "Connection Error",
          description: "Unable to connect to real-time messaging",
          variant: "destructive",
          duration: 3000,
        });
      });

      // User presence handlers
      newSocket.on("user:online", (userId: string) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on("user:offline", (userId: string) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on("user:status_change", (data: { userId: string; status: string }) => {
        // Handle status changes if needed
        console.log("User status changed:", data);
      });

      // Typing indicators
      newSocket.on("typing:start", (data: { channelId: string; userId: string; username: string }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const channelTyping = newMap.get(data.channelId) || new Set();
          channelTyping.add(data.userId);
          newMap.set(data.channelId, channelTyping);
          return newMap;
        });
      });

      newSocket.on("typing:stop", (data: { channelId: string; userId: string }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const channelTyping = newMap.get(data.channelId);
          if (channelTyping) {
            channelTyping.delete(data.userId);
            if (channelTyping.size === 0) {
              newMap.delete(data.channelId);
            } else {
              newMap.set(data.channelId, channelTyping);
            }
          }
          return newMap;
        });
      });

      // Error handler
      newSocket.on("error", (error: { message: string; code?: string }) => {
        console.error("WebSocket error:", error);
        
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      };
    }
  }, [session, status, socket]);

  // Cleanup on session end
  useEffect(() => {
    if (status === "unauthenticated" && socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    }
  }, [status, socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}