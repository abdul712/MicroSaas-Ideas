/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    user: { count: jest.fn() },
    organization: { count: jest.fn() },
    leadMagnet: { count: jest.fn() },
  },
}))

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  default: {
    ping: jest.fn(),
    info: jest.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when all services are up', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock successful database connection
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }])
      // Mock successful Redis connection
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services.database).toBe('healthy')
      expect(data.services.redis).toBe('healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('performance')
      expect(data.performance).toHaveProperty('responseTime')
      expect(data.performance).toHaveProperty('uptime')
    })

    it('should return degraded status when database is down', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock failed database connection
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'))
      // Mock successful Redis connection
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
      expect(data.services.database).toBe('unhealthy')
      expect(data.services.redis).toBe('healthy')
    })

    it('should return degraded status when Redis is down', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock successful database connection
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }])
      // Mock failed Redis connection
      ;(redis.ping as jest.Mock).mockRejectedValue(new Error('Redis connection failed'))

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
      expect(data.services.database).toBe('healthy')
      expect(data.services.redis).toBe('unhealthy')
    })

    it('should check AI service configuration', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock successful connections
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }])
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      // Set OpenAI API key
      process.env.OPENAI_API_KEY = 'test-key'

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(data.services.ai).toBe('configured')
    })

    it('should detect missing AI configuration', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock successful connections
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }])
      ;(redis.ping as jest.Mock).mockResolvedValue('PONG')

      // Remove OpenAI API key
      delete process.env.OPENAI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
      expect(data.services.ai).toBe('not_configured')
    })
  })

  describe('POST /api/health', () => {
    it('should return detailed health metrics', async () => {
      const { prisma } = await import('@/lib/prisma')
      const redis = (await import('@/lib/redis')).default

      // Mock database metrics
      ;(prisma.user.count as jest.Mock).mockResolvedValue(150)
      ;(prisma.organization.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.leadMagnet.count as jest.Mock).mockResolvedValue(500)

      // Mock Redis info
      ;(redis.info as jest.Mock).mockResolvedValue('used_memory_human:2.5M\\r\\n')

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services.database.metrics).toEqual({
        users: 150,
        organizations: 50,
        leadMagnets: 500,
      })
      expect(data.services.redis.metrics.memory).toBe('2.5M')
      expect(data.performance.memory).toHaveProperty('used')
      expect(data.performance.memory).toHaveProperty('total')
      expect(data).toHaveProperty('environment')
      expect(data).toHaveProperty('version')
    })

    it('should handle database errors in detailed check', async () => {
      const { prisma } = await import('@/lib/prisma')

      // Mock database error
      ;(prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('timestamp')
      expect(data.performance).toHaveProperty('responseTime')
    })
  })
})