import { GET, POST } from '../tickets/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
    },
    ticketTag: {
      createMany: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/openai', () => ({
  analyzeTicket: jest.fn().mockResolvedValue({
    sentiment: 'neutral',
    category: 'general',
    priority: 'MEDIUM',
    urgencyScore: 50,
    suggestedTags: ['general'],
    escalationRecommended: false,
  }),
}))

const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    organizationId: 'org-123',
  },
}

const mockTickets = [
  {
    id: 'ticket-1',
    ticketNumber: '#TK-001',
    subject: 'Test Ticket',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    createdAt: new Date(),
    assignedAgent: null,
    department: null,
    tags: [],
    _count: { comments: 0 },
  },
]

describe('/api/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return tickets for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tickets')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tickets).toEqual(mockTickets)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasMore: false,
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tickets')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle pagination parameters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(25)

      const request = new NextRequest('http://localhost:3000/api/tickets?page=2&limit=5')
      await GET(request)

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        })
      )
    })

    it('should handle search and filter parameters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets)
      ;(prisma.ticket.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/tickets?status=OPEN&priority=HIGH&search=test'
      )
      await GET(request)

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: 'OPEN',
            priority: 'HIGH',
            OR: expect.arrayContaining([
              { subject: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })
  })

  describe('POST', () => {
    const validTicketData = {
      subject: 'Test Ticket',
      description: 'This is a test ticket',
      customerEmail: 'customer@example.com',
      customerName: 'Customer Name',
      priority: 'MEDIUM',
      source: 'WEB_FORM',
    }

    const mockCreatedTicket = {
      id: 'ticket-123',
      ticketNumber: '#TK-123',
      ...validTicketData,
      organizationId: 'org-123',
      createdById: 'user-123',
      assignedAgent: null,
      department: null,
      createdBy: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    it('should create a ticket for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockCreatedTicket)
      ;(prisma.activity.create as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(validTicketData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCreatedTicket)
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: validTicketData.subject,
            description: validTicketData.description,
            customerEmail: validTicketData.customerEmail,
            organizationId: 'org-123',
            createdById: 'user-123',
          }),
        })
      )
    })

    it('should return 401 for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(validTicketData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const invalidData = {
        // Missing required fields
        description: 'This is a test ticket',
      }

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should handle tags when provided', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.ticket.create as jest.Mock).mockResolvedValue(mockCreatedTicket)
      ;(prisma.tag.upsert as jest.Mock).mockResolvedValue({ id: 'tag-1', name: 'urgent' })
      ;(prisma.ticketTag.createMany as jest.Mock).mockResolvedValue({})
      ;(prisma.activity.create as jest.Mock).mockResolvedValue({})

      const dataWithTags = {
        ...validTicketData,
        tags: ['urgent', 'billing'],
      }

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(dataWithTags),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      expect(prisma.tag.upsert).toHaveBeenCalledTimes(2)
      expect(prisma.ticketTag.createMany).toHaveBeenCalled()
    })
  })
})