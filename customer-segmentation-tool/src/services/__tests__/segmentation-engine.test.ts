import { SegmentationEngine } from '../segmentation-engine'
import { prismaMock } from '../__mocks__/prisma'

// Mock Redis
jest.mock('@/lib/redis', () => ({
  cacheUtils: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CACHE_KEYS: {
    RFM_SCORES: (orgId: string) => `org:${orgId}:rfm`,
    SEGMENT_CUSTOMERS: (segmentId: string) => `segment:${segmentId}:customers`,
  }
}))

describe('SegmentationEngine', () => {
  let engine: SegmentationEngine
  const mockOrganizationId = 'org-123'

  beforeEach(() => {
    engine = new SegmentationEngine()
    jest.clearAllMocks()
  })

  describe('performRFMAnalysis', () => {
    it('should calculate RFM scores correctly', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          events: [
            {
              eventType: 'purchase',
              timestamp: new Date('2024-01-15'),
              value: 100
            },
            {
              eventType: 'purchase',
              timestamp: new Date('2024-01-10'),
              value: 50
            }
          ]
        },
        {
          id: 'customer-2',
          events: [
            {
              eventType: 'purchase',
              timestamp: new Date('2024-01-01'),
              value: 200
            }
          ]
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)

      const result = await engine.performRFMAnalysis(mockOrganizationId)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('customerId', 'customer-1')
      expect(result[0]).toHaveProperty('recency')
      expect(result[0]).toHaveProperty('frequency')
      expect(result[0]).toHaveProperty('monetary')
      expect(result[0]).toHaveProperty('segment')
      
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        include: {
          events: {
            where: { eventType: 'purchase' },
            orderBy: { timestamp: 'desc' }
          }
        }
      })
    })

    it('should handle customers with no purchase events', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          events: []
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)

      const result = await engine.performRFMAnalysis(mockOrganizationId)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        customerId: 'customer-1',
        recency: expect.any(Number),
        frequency: expect.any(Number),
        monetary: expect.any(Number),
        segment: expect.any(String)
      })
    })
  })

  describe('performKMeansClustering', () => {
    it('should perform k-means clustering', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          totalSpent: 500,
          orderCount: 5,
          avgOrderValue: 100,
          lastOrderAt: new Date('2024-01-15'),
          recencyScore: 5,
          frequencyScore: 4,
          monetaryScore: 3,
          events: [
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'page_view', timestamp: new Date() }
          ]
        },
        {
          id: 'customer-2',
          totalSpent: 1000,
          orderCount: 10,
          avgOrderValue: 100,
          lastOrderAt: new Date('2024-01-10'),
          recencyScore: 4,
          frequencyScore: 5,
          monetaryScore: 5,
          events: [
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'page_view', timestamp: new Date() }
          ]
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)

      const config = {
        type: 'kmeans' as const,
        parameters: { k: 2 },
        features: ['totalSpent', 'orderCount', 'avgOrderValue']
      }

      const result = await engine.performKMeansClustering(mockOrganizationId, config)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('customerId')
      expect(result[0]).toHaveProperty('clusterId')
      expect(result[0]).toHaveProperty('confidence')
      expect(result[0]).toHaveProperty('features')

      expect(prismaMock.customer.update).toHaveBeenCalledTimes(2)
    })

    it('should handle empty customer list', async () => {
      prismaMock.customer.findMany.mockResolvedValue([])

      const config = {
        type: 'kmeans' as const,
        parameters: { k: 2 },
        features: ['totalSpent']
      }

      const result = await engine.performKMeansClustering(mockOrganizationId, config)

      expect(result).toHaveLength(0)
    })
  })

  describe('performBehavioralSegmentation', () => {
    it('should identify behavioral segments', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          events: [
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'purchase', timestamp: new Date() },
            { eventType: 'email_open', timestamp: new Date() },
            { eventType: 'email_open', timestamp: new Date() },
            { eventType: 'email_open', timestamp: new Date() }
          ]
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.segment.findFirst.mockResolvedValue(null)
      prismaMock.segment.create.mockResolvedValue({
        id: 'segment-1',
        organizationId: mockOrganizationId,
        name: 'High Value Customers',
        type: 'BEHAVIORAL'
      } as any)
      prismaMock.segmentMembership.upsert.mockResolvedValue({} as any)

      await engine.performBehavioralSegmentation(mockOrganizationId)

      expect(prismaMock.segment.create).toHaveBeenCalledWith({
        data: {
          organizationId: mockOrganizationId,
          name: 'High Value Customers',
          type: 'BEHAVIORAL',
          description: 'Automatically generated behavioral segment: High Value Customers',
          rules: { behavioral: true, pattern: 'High Value Customers' }
        }
      })

      expect(prismaMock.segmentMembership.upsert).toHaveBeenCalled()
    })
  })

  describe('createRuleBasedSegment', () => {
    it('should create rule-based segment', async () => {
      const mockSegment = {
        id: 'segment-1',
        organizationId: mockOrganizationId,
        name: 'High Value',
        type: 'MANUAL'
      }

      prismaMock.segment.create.mockResolvedValue(mockSegment as any)
      prismaMock.segmentMembership.deleteMany.mockResolvedValue({ count: 0 })
      prismaMock.customer.findMany.mockResolvedValue([{ id: 'customer-1' }] as any)
      prismaMock.segmentMembership.create.mockResolvedValue({} as any)
      prismaMock.segment.update.mockResolvedValue({} as any)

      const criteria = {
        rules: [
          {
            field: 'totalSpent',
            operator: 'greater_than' as const,
            value: 1000
          }
        ],
        logic: 'AND' as const
      }

      const result = await engine.createRuleBasedSegment(
        mockOrganizationId,
        'High Value',
        'Customers who spent more than $1000',
        criteria
      )

      expect(result).toEqual(mockSegment)
      expect(prismaMock.segment.create).toHaveBeenCalledWith({
        data: {
          organizationId: mockOrganizationId,
          name: 'High Value',
          description: 'Customers who spent more than $1000',
          type: 'MANUAL',
          rules: criteria
        }
      })
    })
  })

  describe('predictChurnProbability', () => {
    it('should calculate churn probability', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          lastOrderAt: new Date('2023-01-01'), // Old order
          orderCount: 1,
          totalSpent: 25,
          events: []
        },
        {
          id: 'customer-2',
          lastOrderAt: new Date(), // Recent order
          orderCount: 10,
          totalSpent: 1000,
          events: [
            { timestamp: new Date(), eventType: 'page_view' }
          ]
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)
      prismaMock.prediction.create.mockResolvedValue({} as any)

      await engine.predictChurnProbability(mockOrganizationId)

      expect(prismaMock.customer.update).toHaveBeenCalledTimes(2)
      expect(prismaMock.prediction.create).toHaveBeenCalledTimes(2)

      // First customer should have high churn probability
      const firstUpdate = prismaMock.customer.update.mock.calls[0][0]
      expect(firstUpdate.data.churnProbability).toBeGreaterThan(0.5)

      // Second customer should have lower churn probability
      const secondUpdate = prismaMock.customer.update.mock.calls[1][0]
      expect(secondUpdate.data.churnProbability).toBeLessThan(0.5)
    })
  })

  describe('predictCustomerLifetimeValue', () => {
    it('should calculate CLV prediction', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          orderCount: 5,
          totalSpent: 500,
          firstOrderAt: new Date('2023-01-01'),
          lastOrderAt: new Date('2024-01-01'),
          events: [
            { eventType: 'purchase', timestamp: new Date('2023-01-01') },
            { eventType: 'purchase', timestamp: new Date('2023-06-01') },
            { eventType: 'purchase', timestamp: new Date('2024-01-01') }
          ]
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)
      prismaMock.prediction.create.mockResolvedValue({} as any)

      await engine.predictCustomerLifetimeValue(mockOrganizationId)

      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: {
          lifetimeValuePrediction: expect.any(Number)
        }
      })

      expect(prismaMock.prediction.create).toHaveBeenCalledWith({
        data: {
          organizationId: mockOrganizationId,
          customerId: 'customer-1',
          predictionType: 'LIFETIME_VALUE',
          value: expect.any(Number),
          confidence: 0.75,
          modelVersion: '1.0'
        }
      })
    })

    it('should handle customers with no orders', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          orderCount: 0,
          totalSpent: 0,
          firstOrderAt: null,
          lastOrderAt: null,
          events: []
        }
      ]

      prismaMock.customer.findMany.mockResolvedValue(mockCustomers as any)
      prismaMock.customer.update.mockResolvedValue({} as any)
      prismaMock.prediction.create.mockResolvedValue({} as any)

      await engine.predictCustomerLifetimeValue(mockOrganizationId)

      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: {
          lifetimeValuePrediction: 0
        }
      })
    })
  })

  describe('updateSegmentMembership', () => {
    it('should update segment membership based on rules', async () => {
      const mockSegment = {
        id: 'segment-1',
        organizationId: mockOrganizationId,
        rules: {
          rules: [
            {
              field: 'totalSpent',
              operator: 'greater_than',
              value: 500
            }
          ],
          logic: 'AND'
        }
      }

      prismaMock.segment.findUnique.mockResolvedValue(mockSegment as any)
      prismaMock.segmentMembership.deleteMany.mockResolvedValue({ count: 0 })
      prismaMock.customer.findMany.mockResolvedValue([
        { id: 'customer-1' },
        { id: 'customer-2' }
      ] as any)
      prismaMock.segmentMembership.create.mockResolvedValue({} as any)
      prismaMock.segment.update.mockResolvedValue({} as any)

      await engine.updateSegmentMembership('segment-1')

      expect(prismaMock.segmentMembership.deleteMany).toHaveBeenCalledWith({
        where: { segmentId: 'segment-1' }
      })

      expect(prismaMock.segmentMembership.create).toHaveBeenCalledTimes(2)

      expect(prismaMock.segment.update).toHaveBeenCalledWith({
        where: { id: 'segment-1' },
        data: {
          customerCount: 2,
          lastUpdatedAt: expect.any(Date)
        }
      })
    })
  })
})