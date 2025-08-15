import { GET, POST } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    user: {
      count: jest.fn(),
    },
    organization: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    ping: jest.fn(),
    info: jest.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return healthy status when all checks pass', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }])
      redis.ping.mockResolvedValue('PONG')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.checks.database.status).toBe('healthy')
      expect(data.checks.redis.status).toBe('healthy')
      expect(data.timestamp).toBeDefined()
      expect(data.uptime).toBeDefined()
      expect(data.memory).toBeDefined()
    })

    it('should return unhealthy status when database check fails', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'))
      redis.ping.mockResolvedValue('PONG')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBe('Database connection failed')
    })

    it('should return unhealthy status when Redis check fails', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }])
      redis.ping.mockRejectedValue(new Error('Redis connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBe('Redis connection failed')
    })

    it('should include proper cache headers', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }])
      redis.ping.mockResolvedValue('PONG')

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('Pragma')).toBe('no-cache')
      expect(response.headers.get('Expires')).toBe('0')
    })
  })

  describe('POST', () => {
    it('should return detailed health information', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }])
      prisma.user.count.mockResolvedValue(100)
      prisma.organization.count.mockResolvedValue(20)
      redis.ping.mockResolvedValue('PONG')
      redis.info.mockResolvedValue('used_memory_human:10.5M')

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.checks.database.stats.users).toBe(100)
      expect(data.checks.database.stats.organizations).toBe(20)
      expect(data.checks.redis.stats.memoryUsed).toBe('10.5M')
      expect(data.checks.memory).toBeDefined()
      expect(data.checks.disk).toBeDefined()
    })

    it('should return degraded status when some checks fail', async () => {
      const { prisma } = require('@/lib/prisma')
      const { redis } = require('@/lib/redis')

      prisma.$queryRaw.mockRejectedValue(new Error('Database error'))
      redis.ping.mockResolvedValue('PONG')
      redis.info.mockResolvedValue('used_memory_human:10.5M')

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('degraded')
      expect(data.checks.database.status).toBe('unhealthy')
      expect(data.checks.redis.status).toBe('healthy')
    })

    it('should handle unexpected errors gracefully', async () => {
      const { prisma } = require('@/lib/prisma')

      prisma.$queryRaw.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.error).toBe('Unexpected error')
    })
  })
})