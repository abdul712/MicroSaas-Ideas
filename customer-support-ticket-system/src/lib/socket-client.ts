'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function initializeSocketClient(): Socket {
  if (socket && socket.connected) {
    return socket
  }

  socket = io({
    path: '/api/socket',
    autoConnect: false,
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): void {
  if (socket && !socket.connected) {
    socket.connect()
  }
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

// Ticket-related socket functions
export function subscribeToTicket(ticketId: string): void {
  if (socket) {
    socket.emit('ticket:subscribe', ticketId)
  }
}

export function unsubscribeFromTicket(ticketId: string): void {
  if (socket) {
    socket.emit('ticket:unsubscribe', ticketId)
  }
}

export function updateTicketStatus(
  ticketId: string, 
  newStatus: string, 
  oldStatus?: string, 
  comment?: string
): void {
  if (socket) {
    socket.emit('ticket:status_change', {
      ticketId,
      newStatus,
      oldStatus,
      comment,
    })
  }
}

export function assignTicket(ticketId: string, assigneeId: string): void {
  if (socket) {
    socket.emit('ticket:assign', { ticketId, assigneeId })
  }
}

// Chat-related socket functions
export function joinChat(chatId: string): void {
  if (socket) {
    socket.emit('chat:join', chatId)
  }
}

export function leaveChat(chatId: string): void {
  if (socket) {
    socket.emit('chat:leave', chatId)
  }
}

export function sendChatMessage(
  chatId: string, 
  message: string, 
  recipientId?: string
): void {
  if (socket) {
    socket.emit('chat:message', { chatId, message, recipientId })
  }
}

export function sendTypingIndicator(chatId: string, isTyping: boolean): void {
  if (socket) {
    socket.emit('chat:typing', { chatId, isTyping })
  }
}

// Agent status functions
export function updateAgentStatus(status: 'available' | 'busy' | 'away'): void {
  if (socket) {
    socket.emit('agent:status', status)
  }
}

// Event listeners
export function onTicketUpdate(callback: (data: any) => void): void {
  if (socket) {
    socket.on('ticket:updated', callback)
  }
}

export function onTicketAssigned(callback: (data: any) => void): void {
  if (socket) {
    socket.on('ticket:assigned', callback)
  }
}

export function onChatMessage(callback: (data: any) => void): void {
  if (socket) {
    socket.on('chat:message', callback)
  }
}

export function onTypingIndicator(callback: (data: any) => void): void {
  if (socket) {
    socket.on('chat:typing', callback)
  }
}

export function onNotification(callback: (data: any) => void): void {
  if (socket) {
    socket.on('notification', callback)
  }
}

export function onAgentStatusUpdate(callback: (data: any) => void): void {
  if (socket) {
    socket.on('agent:status_update', callback)
  }
}

// Cleanup function
export function removeAllListeners(): void {
  if (socket) {
    socket.removeAllListeners()
  }
}