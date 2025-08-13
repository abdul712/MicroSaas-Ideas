import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/chat/route'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}))

describe('/api/chat', () => {
  describe('POST /api/chat', () => {
    it('should create a new message successfully', async () => {
      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        content: 'Hello, world!',
        senderType: 'VISITOR',
        createdAt: new Date().toISOString(),
      }

      const mockConversation = {
        id: 'conv-123',
        organizationId: 'org-123',
        visitorId: 'visitor-123',
        status: 'ACTIVE',
        visitor: { id: 'visitor-123', name: 'John Doe' },
        assignedUser: null,
      }

      // Mock Prisma responses
      const mockPrisma = require('@prisma/client').PrismaClient()
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation)
      mockPrisma.message.create.mockResolvedValue(mockMessage)
      mockPrisma.conversation.update.mockResolvedValue(mockConversation)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          content: 'Hello, world!',
          senderType: 'VISITOR',
          organizationId: 'org-123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toEqual(mockMessage)
      expect(data.conversationId).toBe('conv-123')
    })

    it('should create a new conversation for new visitor', async () => {
      const mockConversation = {
        id: 'conv-new',
        organizationId: 'org-123',
        visitorId: 'visitor-new',
        status: 'WAITING',
        visitor: { id: 'visitor-new', name: null },
        assignedUser: null,
      }

      const mockMessage = {
        id: 'msg-new',
        conversationId: 'conv-new',
        content: 'First message',
        senderType: 'VISITOR',
        createdAt: new Date().toISOString(),
      }

      const mockPrisma = require('@prisma/client').PrismaClient()
      mockPrisma.conversation.create.mockResolvedValue(mockConversation)
      mockPrisma.message.create.mockResolvedValue(mockMessage)
      mockPrisma.conversation.update.mockResolvedValue(mockConversation)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          content: 'First message',
          senderType: 'VISITOR',
          visitorId: 'visitor-new',
          organizationId: 'org-123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          visitorId: 'visitor-new',
          status: 'WAITING',
          priority: 'NORMAL',
        },
        include: {
          visitor: true,
          assignedUser: true,
        },
      })
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          content: '', // Invalid: empty content
          senderType: 'VISITOR',
          organizationId: 'org-123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle invalid sender type', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Valid content',
          senderType: 'INVALID_TYPE', // Invalid sender type
          organizationId: 'org-123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })

  describe('GET /api/chat', () => {
    it('should fetch messages for a conversation', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-123',
          content: 'Hello',
          senderType: 'VISITOR',
          createdAt: new Date().toISOString(),
          sender: null,
        },
        {
          id: 'msg-2',
          conversationId: 'conv-123',
          content: 'Hi there!',
          senderType: 'AGENT',
          createdAt: new Date().toISOString(),
          sender: {
            id: 'agent-1',
            name: 'Agent Smith',
            email: 'agent@example.com',
          },
        },
      ]

      const mockPrisma = require('@prisma/client').PrismaClient()
      mockPrisma.message.findMany.mockResolvedValue(mockMessages)

      const request = new NextRequest(
        'http://localhost:3000/api/chat?conversationId=conv-123&organizationId=org-123'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.messages).toEqual(mockMessages)
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-123',
          conversation: {
            organizationId: 'org-123',
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip: 0,
        take: 50,
      })
    })

    it('should require conversationId and organizationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('conversationId and organizationId are required')
    })

    it('should handle pagination parameters', async () => {
      const mockPrisma = require('@prisma/client').PrismaClient()
      mockPrisma.message.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/chat?conversationId=conv-123&organizationId=org-123&limit=25&offset=50'
      )

      await GET(request)

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        })
      )
    })
  })
})