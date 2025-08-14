import { render } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { io, Socket } from 'socket.io-client'
import './styles.css'

interface Message {
  id: string
  content: string
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM' | 'BOT'
  sender?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  messageType: string
}

interface WidgetConfig {
  organizationId: string
  widgetId?: string
  apiUrl?: string
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  textColor?: string
  greetingMessage?: string
  placeholderText?: string
  showAvatar?: boolean
  enabled?: boolean
}

interface ChatWidgetProps {
  config: WidgetConfig
}

const ChatWidget = ({ config }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  const apiUrl = config.apiUrl || '/api'
  const primaryColor = config.primaryColor || '#3B82F6'
  const position = config.position || 'bottom-right'

  // Initialize visitor and socket connection
  useEffect(() => {
    if (!config.enabled) return

    const initializeWidget = async () => {
      try {
        // Create or get visitor
        const visitorData = {
          organizationId: config.organizationId,
          widgetId: config.widgetId,
          identifier: localStorage.getItem('livechat_visitor_id'),
          userAgent: navigator.userAgent,
          ipAddress: '', // Will be set by server
          metadata: {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        }

        const response = await fetch(`${apiUrl}/visitors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitorData),
        })

        const { visitor } = await response.json()
        setVisitorId(visitor.id)
        
        if (!localStorage.getItem('livechat_visitor_id')) {
          localStorage.setItem('livechat_visitor_id', visitor.id)
        }

        // Initialize socket connection
        const socketInstance = io({
          auth: {
            organizationId: config.organizationId,
            userType: 'visitor',
          }
        })

        socketInstance.on('connect', () => {
          setIsConnected(true)
          socketInstance.emit('visitor_connected', {
            visitorId: visitor.id,
            organizationId: config.organizationId
          })
        })

        socketInstance.on('disconnect', () => {
          setIsConnected(false)
        })

        socketInstance.on('message_received', (data) => {
          if (data.conversationId === conversationId) {
            setMessages(prev => [...prev, data.message])
          }
        })

        socketInstance.on('typing_started', (data) => {
          if (data.conversationId === conversationId && data.senderType === 'AGENT') {
            setIsTyping(true)
          }
        })

        socketInstance.on('typing_stopped', (data) => {
          if (data.conversationId === conversationId && data.senderType === 'AGENT') {
            setIsTyping(false)
          }
        })

        setSocket(socketInstance)
      } catch (error) {
        console.error('Error initializing widget:', error)
      }
    }

    initializeWidget()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [config.organizationId, config.enabled])

  const startConversation = async () => {
    if (!visitorId || conversationId) return

    try {
      const response = await fetch(`${apiUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: config.organizationId,
          visitorId: visitorId,
          priority: 'NORMAL'
        }),
      })

      const { conversation } = await response.json()
      setConversationId(conversation.id)

      if (socket) {
        socket.emit('join_conversation', {
          conversationId: conversation.id,
          userType: 'visitor',
          organizationId: config.organizationId
        })
      }

      // Add greeting message if configured
      if (config.greetingMessage) {
        setMessages([{
          id: 'greeting',
          content: config.greetingMessage,
          senderType: 'SYSTEM',
          createdAt: new Date().toISOString(),
          messageType: 'TEXT'
        }])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !socket) return

    if (!conversationId) {
      await startConversation()
    }

    const messageData = {
      conversationId: conversationId!,
      content: inputValue.trim(),
      senderType: 'VISITOR' as const,
      messageType: 'TEXT'
    }

    socket.emit('send_message', messageData)
    
    // Add message to local state immediately
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: inputValue.trim(),
      senderType: 'VISITOR',
      createdAt: new Date().toISOString(),
      messageType: 'TEXT'
    }
    
    setMessages(prev => [...prev, tempMessage])
    setInputValue('')
  }, [inputValue, conversationId, socket])

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!config.enabled) {
    return null
  }

  const positionClasses = position === 'bottom-left' 
    ? 'bottom-4 left-4' 
    : 'bottom-4 right-4'

  return (
    <div 
      className={`fixed ${positionClasses} z-50 font-sans`}
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-96'
          } w-80 flex flex-col`}
          style={{ maxHeight: '500px' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 rounded-t-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              {config.showAvatar && (
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1z"/>
                  </svg>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">Support Chat</h3>
                <p className="text-xs opacity-90">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMinimized ? (
                    <path d="M18 15l-6-6-6 6" />
                  ) : (
                    <path d="M6 9l6 6 6-6" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '240px' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === 'VISITOR' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.senderType === 'VISITOR'
                          ? 'text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                      style={{
                        backgroundColor: message.senderType === 'VISITOR' ? primaryColor : undefined
                      }}
                    >
                      {message.sender && message.senderType === 'AGENT' && (
                        <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                      )}
                      <p>{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                    onKeyPress={handleKeyPress}
                    placeholder={config.placeholderText || "Type your message..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || !isConnected}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Widget initialization function
export function initWidget(config: WidgetConfig) {
  // Create container
  const container = document.createElement('div')
  container.id = 'live-chat-widget-container'
  document.body.appendChild(container)

  // Render widget
  render(<ChatWidget config={config} />, container)
}

// Global initialization
if (typeof window !== 'undefined') {
  (window as any).LiveChatWidget = { init: initWidget }
}