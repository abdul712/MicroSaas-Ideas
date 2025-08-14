'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        query: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
        },
        transports: ['websocket', 'polling'],
      })

      socketInstance.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [session?.user])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}