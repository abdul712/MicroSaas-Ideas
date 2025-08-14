import { POST, GET } from '@/app/api/hashtags/search/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/hashtags/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/hashtags/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          platform: 'INSTAGRAM'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate request body', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/hashtags/search', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should perform hashtag search successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      })

      // Mock user with analytics
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        plan: 'FREE',
        analytics: [],
      } as any)

      // Mock hashtag search results
      mockPrisma.hashtag.findMany.mockResolvedValue([
        {
          id: 'hashtag1',
          tag: 'test',
          platform: 'INSTAGRAM',
          postCount: BigInt(1000),
          avgEngagement: 0.05,
          difficultyScore: 50,
          trendScore: 70,
          history: [],
        }
      ] as any)

      // Mock related hashtags
      mockPrisma.hashtag.findMany.mockResolvedValueOnce([
        { tag: 'testing' },
        { tag: 'testcase' },
      ] as any)

      // Mock search creation
      mockPrisma.hashtagSearch.create.mockResolvedValue({} as any)

      // Mock analytics upsert
      mockPrisma.userAnalytics.upsert.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/hashtags/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          platform: 'INSTAGRAM',
          type: 'KEYWORD',
          limit: 10
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.results).toHaveLength(1)
      expect(data.data.results[0].hashtag).toBe('test')
    })

    it('should enforce plan limits', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      })

      // Mock user with plan limit exceeded
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        plan: 'FREE',
        analytics: [
          { searchesCount: 30 } // FREE plan limit is 30
        ],
      } as any)

      const request = new NextRequest('http://localhost:3000/api/hashtags/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          platform: 'INSTAGRAM'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Monthly search limit exceeded')
    })
  })

  describe('GET', () => {
    it('should get trending hashtags', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      })

      mockPrisma.hashtag.findMany.mockResolvedValue([
        {
          id: 'hashtag1',
          tag: 'trending',
          platform: 'INSTAGRAM',
          postCount: BigInt(5000),
          avgEngagement: 0.08,
          difficultyScore: 30,
          trendScore: 90,
        }
      ] as any)

      const request = new NextRequest('http://localhost:3000/api/hashtags/search?platform=INSTAGRAM&limit=20')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should require valid platform parameter', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/hashtags/search?platform=INVALID')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Valid platform is required')
    })
  })
})