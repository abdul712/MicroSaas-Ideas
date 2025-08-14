import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext, TenantAwarePrisma } from '@/lib/tenant-context'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().url(),
  industry: z.string().optional(),
  monthlyTraffic: z.number().optional(),
  primaryGoal: z.string().optional(),
  timezone: z.string().default('UTC'),
})

export async function GET(req: NextRequest) {
  return withTenantContext(req, async (req, context) => {
    try {
      const tenantPrisma = new TenantAwarePrisma(context.tenantId)
      
      const projects = await tenantPrisma.project.findMany({
        include: {
          _count: {
            select: {
              tests: true,
              conversionEvents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ projects })
    } catch (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }
  })
}

export async function POST(req: NextRequest) {
  return withTenantContext(req, async (req, context) => {
    try {
      const body = await req.json()
      const validatedData = createProjectSchema.parse(body)
      
      const tenantPrisma = new TenantAwarePrisma(context.tenantId)
      
      // Check if domain already exists for this tenant
      const existingProject = await tenantPrisma.project.findUnique({
        where: { domain: validatedData.domain },
      })
      
      if (existingProject) {
        return NextResponse.json(
          { error: 'Project with this domain already exists' },
          { status: 400 }
        )
      }
      
      const project = await tenantPrisma.project.create({
        data: {
          ...validatedData,
          userId: context.userId,
        },
        include: {
          _count: {
            select: {
              tests: true,
              conversionEvents: true,
            },
          },
        },
      })

      return NextResponse.json({ project }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400 }
        )
      }
      
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }
  })
}