/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../../app/api/events/route'

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = require('../../lib/prisma').prisma

describe('/api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/events', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/events', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    it('should reject requests without API key', async () => {
      const request = createMockRequest({
        events: [{ eventType: 'test', customerId: 'test123' }]
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('API key is required')
    })

    it('should reject requests without events array', async () => {
      const request = createMockRequest({
        apiKey: 'test-key'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Events array is required')
    })

    it('should reject requests with invalid API key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null)

      const request = createMockRequest({
        apiKey: 'invalid-key',
        events: [{ eventType: 'test', customerId: 'test123' }]
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid API key')
    })

    it('should process valid events successfully', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' }
      }

      const mockCustomer = {
        id: 'customer-1',
        externalId: 'test123',
        orgId: 'org-1'
      }

      const mockEvent = {
        id: 'event-1',
        eventType: 'page_view',
        customerId: 'customer-1'
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.apiKey.update.mockResolvedValue(mockApiKey)
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer)
      mockPrisma.event.create.mockResolvedValue(mockEvent)

      const request = createMockRequest({
        apiKey: 'valid-key',
        events: [
          {
            eventType: 'page_view',
            customerId: 'test123',
            properties: {
              url: '/dashboard',
              title: 'Dashboard'
            }
          }
        ]
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.processed).toBe(1)
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'page_view',
          customerId: 'customer-1',
          properties: expect.objectContaining({
            url: '/dashboard',
            title: 'Dashboard'
          })
        })
      })
    })

    it('should create new customer if not found', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' }
      }

      const mockNewCustomer = {
        id: 'customer-new',
        externalId: 'new-customer',
        orgId: 'org-1'
      }

      const mockEvent = {
        id: 'event-1',
        eventType: 'page_view',
        customerId: 'customer-new'
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.apiKey.update.mockResolvedValue(mockApiKey)
      mockPrisma.customer.findFirst.mockResolvedValue(null) // Customer not found
      mockPrisma.customer.create.mockResolvedValue(mockNewCustomer)
      mockPrisma.event.create.mockResolvedValue(mockEvent)

      const request = createMockRequest({
        apiKey: 'valid-key',
        events: [
          {
            eventType: 'page_view',
            customerId: 'new-customer',
            properties: { url: '/home' }
          }
        ]
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          externalId: 'new-customer',
          orgId: 'org-1'
        })
      })
    })

    it('should skip invalid events', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' }
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.apiKey.update.mockResolvedValue(mockApiKey)

      const request = createMockRequest({
        apiKey: 'valid-key',
        events: [
          { eventType: 'valid_event', customerId: 'test123' },
          { eventType: '', customerId: 'test123' }, // Invalid - no eventType
          { eventType: 'another_event' }, // Invalid - no customerId
        ]
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.processed).toBe(1) // Only 1 valid event processed
    })
  })

  describe('GET /api/events', () => {
    const createMockGetRequest = (params: Record<string, string>) => {
      const url = new URL('http://localhost:3000/api/events')
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
      
      return new NextRequest(url.toString(), { method: 'GET' })
    }

    it('should reject requests without API key', async () => {
      const request = createMockGetRequest({})

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('API key is required')
    })

    it('should return events for valid API key', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1'
      }

      const mockEvents = [
        {
          id: 'event-1',
          eventType: 'page_view',
          properties: { url: '/dashboard' },
          timestamp: new Date(),
          sessionId: 'session-1',
          journeyId: 'journey-1',
          customer: {
            externalId: 'customer-123',
            attributes: { plan: 'pro' }
          }
        }
      ]

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.event.findMany.mockResolvedValue(mockEvents)

      const request = createMockGetRequest({
        apiKey: 'valid-key'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0]).toMatchObject({
        id: 'event-1',
        eventType: 'page_view',
        customerId: 'customer-123'
      })
    })

    it('should filter events by journey ID', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1'
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = createMockGetRequest({
        apiKey: 'valid-key',
        journeyId: 'specific-journey'
      })

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          customer: { orgId: 'org-1' },
          journeyId: 'specific-journey'
        },
        include: expect.any(Object),
        orderBy: { timestamp: 'desc' },
        take: 100
      })
    })

    it('should respect limit parameter', async () => {
      const mockApiKey = {
        id: 'api-key-1',
        orgId: 'org-1'
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = createMockGetRequest({
        apiKey: 'valid-key',
        limit: '50'
      })

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50
        })
      )
    })
  })
})