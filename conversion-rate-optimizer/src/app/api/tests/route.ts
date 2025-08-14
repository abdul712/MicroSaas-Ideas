import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext, TenantAwarePrisma } from '@/lib/tenant-context'
import StatisticalEngine from '@/lib/statistics'
import { z } from 'zod'

const createTestSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(255),
  hypothesis: z.string().min(1),
  type: z.enum(['AB', 'MULTIVARIATE', 'REDIRECT', 'SPLIT_URL']),
  targetUrl: z.string().url(),
  trafficAllocation: z.object({
    control: z.number().min(0).max(100),
    variations: z.array(z.number().min(0).max(100)),
  }),
  targetingRules: z.object({}).optional(),
  confidenceLevel: z.number().min(90).max(99).default(95),
  minimumSampleSize: z.number().min(100).default(1000),
  expectedLift: z.number().optional(),
  variations: z.array(z.object({
    name: z.string(),
    changes: z.object({}),
    trafficPercentage: z.number().min(0).max(100),
    isControl: z.boolean().default(false),
  })),
})

export async function GET(req: NextRequest) {
  return withTenantContext(req, async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const status = searchParams.get('status')
      
      const tenantPrisma = new TenantAwarePrisma(context.tenantId)
      
      const whereClause: any = {}
      if (projectId) {
        whereClause.projectId = projectId
      }
      if (status) {
        whereClause.status = status
      }
      
      const tests = await tenantPrisma.test.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          variations: true,
          results: {
            orderBy: {
              recordedAt: 'desc',
            },
            take: 10,
          },
          _count: {
            select: {
              variations: true,
              results: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Calculate current statistics for running tests
      const testsWithStats = await Promise.all(
        tests.map(async (test) => {
          if (test.status === 'RUNNING' && test.variations.length >= 2) {
            try {
              const control = test.variations.find(v => v.isControl)
              const variation = test.variations.find(v => !v.isControl)
              
              if (control && variation) {
                const stats = StatisticalEngine.calculateTestStatistics(
                  control.conversions,
                  control.visitors,
                  variation.conversions,
                  variation.visitors,
                  test.confidenceLevel
                )
                
                return {
                  ...test,
                  currentStats: stats,
                }
              }
            } catch (error) {
              console.error('Error calculating stats for test:', test.id, error)
            }
          }
          
          return test
        })
      )

      return NextResponse.json({ tests: testsWithStats })
    } catch (error) {
      console.error('Error fetching tests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      )
    }
  })
}

export async function POST(req: NextRequest) {
  return withTenantContext(req, async (req, context) => {
    try {
      const body = await req.json()
      const validatedData = createTestSchema.parse(body)
      
      const tenantPrisma = new TenantAwarePrisma(context.tenantId)
      
      // Verify project access
      const project = await tenantPrisma.project.findUnique({
        where: { id: validatedData.projectId },
      })
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      
      // Validate traffic allocation adds up to 100%
      const totalAllocation = validatedData.trafficAllocation.control +
        validatedData.trafficAllocation.variations.reduce((sum, v) => sum + v, 0)
      
      if (Math.abs(totalAllocation - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Traffic allocation must sum to 100%' },
          { status: 400 }
        )
      }
      
      // Create test with variations
      const test = await tenantPrisma.test.create({
        data: {
          projectId: validatedData.projectId,
          userId: context.userId,
          name: validatedData.name,
          hypothesis: validatedData.hypothesis,
          type: validatedData.type,
          targetUrl: validatedData.targetUrl,
          trafficAllocation: validatedData.trafficAllocation,
          targetingRules: validatedData.targetingRules,
          confidenceLevel: validatedData.confidenceLevel,
          minimumSampleSize: validatedData.minimumSampleSize,
          expectedLift: validatedData.expectedLift,
          status: 'DRAFT',
          variations: {
            create: validatedData.variations.map((variation, index) => ({
              name: variation.name,
              changes: variation.changes,
              trafficPercentage: variation.trafficPercentage,
              isControl: variation.isControl,
            })),
          },
        },
        include: {
          variations: true,
          project: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
        },
      })

      return NextResponse.json({ test }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400 }
        )
      }
      
      console.error('Error creating test:', error)
      return NextResponse.json(
        { error: 'Failed to create test' },
        { status: 500 }
      )
    }
  })
}