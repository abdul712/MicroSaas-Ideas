import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions, TenantContext } from './auth'
import { prisma } from './prisma'

/**
 * Multi-tenant context middleware for API routes
 */
export async function withTenantContext(
  req: NextRequest,
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context: TenantContext = {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      role: session.user.role,
    }

    // Verify tenant access
    const tenant = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: { id: true, status: true },
    })

    if (!tenant || tenant.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 403 })
    }

    return handler(req, context)
  } catch (error) {
    console.error('Tenant context error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Tenant-aware Prisma query wrapper
 */
export class TenantAwarePrisma {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  // Projects with tenant isolation
  get project() {
    return {
      findMany: (args: any = {}) => {
        return prisma.project.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.project.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.project.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.project.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      delete: (args: any) => {
        return prisma.project.deleteMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }

  // Tests with tenant isolation through project relationship
  get test() {
    return {
      findMany: async (args: any = {}) => {
        const projects = await this.project.findMany({ select: { id: true } })
        const projectIds = projects.map(p => p.id)
        
        return prisma.test.findMany({
          ...args,
          where: {
            ...args.where,
            projectId: { in: projectIds },
          },
        })
      },
      findUnique: async (args: any) => {
        const projects = await this.project.findMany({ select: { id: true } })
        const projectIds = projects.map(p => p.id)
        
        return prisma.test.findFirst({
          ...args,
          where: {
            ...args.where,
            projectId: { in: projectIds },
          },
        })
      },
      create: async (args: any) => {
        // Verify project belongs to tenant
        const project = await this.project.findUnique({
          where: { id: args.data.projectId },
          select: { id: true },
        })
        
        if (!project) {
          throw new Error('Project not found or access denied')
        }
        
        return prisma.test.create(args)
      },
    }
  }

  // Conversion events with tenant isolation
  get conversionEvent() {
    return {
      findMany: async (args: any = {}) => {
        const projects = await this.project.findMany({ select: { id: true } })
        const projectIds = projects.map(p => p.id)
        
        return prisma.conversionEvent.findMany({
          ...args,
          where: {
            ...args.where,
            projectId: { in: projectIds },
          },
        })
      },
      create: async (args: any) => {
        // Verify project belongs to tenant
        const project = await this.project.findUnique({
          where: { id: args.data.projectId },
          select: { id: true },
        })
        
        if (!project) {
          throw new Error('Project not found or access denied')
        }
        
        return prisma.conversionEvent.create(args)
      },
    }
  }

  // Users within tenant
  get user() {
    return {
      findMany: (args: any = {}) => {
        return prisma.user.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.user.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.user.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.user.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }
}

/**
 * Rate limiting for tenant API calls
 */
export class TenantRateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>()

  static async checkLimit(
    tenantId: string, 
    limit: number = 1000, 
    windowMs: number = 60000
  ): Promise<boolean> {
    const now = Date.now()
    const key = `${tenantId}:${Math.floor(now / windowMs)}`
    
    const current = this.limits.get(key) || { count: 0, resetTime: now + windowMs }
    
    if (now > current.resetTime) {
      current.count = 0
      current.resetTime = now + windowMs
    }
    
    current.count++
    this.limits.set(key, current)
    
    // Cleanup old entries
    for (const [k, v] of this.limits.entries()) {
      if (now > v.resetTime) {
        this.limits.delete(k)
      }
    }
    
    return current.count <= limit
  }

  static getRemainingRequests(tenantId: string, limit: number = 1000): number {
    const now = Date.now()
    const key = `${tenantId}:${Math.floor(now / 60000)}`
    const current = this.limits.get(key)
    
    if (!current || now > current.resetTime) {
      return limit
    }
    
    return Math.max(0, limit - current.count)
  }
}

/**
 * Tenant data isolation validation
 */
export class DataIsolationValidator {
  /**
   * Validate that a user can only access data from their tenant
   */
  static async validateProjectAccess(
    tenantId: string, 
    projectId: string
  ): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true },
    })
    
    return project?.tenantId === tenantId
  }

  /**
   * Validate test access through project ownership
   */
  static async validateTestAccess(
    tenantId: string, 
    testId: string
  ): Promise<boolean> {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { project: { select: { tenantId: true } } },
    })
    
    return test?.project.tenantId === tenantId
  }

  /**
   * Validate conversion event access
   */
  static async validateConversionEventAccess(
    tenantId: string, 
    eventId: string
  ): Promise<boolean> {
    const event = await prisma.conversionEvent.findUnique({
      where: { id: eventId },
      include: { project: { select: { tenantId: true } } },
    })
    
    return event?.project.tenantId === tenantId
  }
}

/**
 * Tenant usage tracking
 */
export class TenantUsageTracker {
  /**
   * Track API usage for billing
   */
  static async trackUsage(
    tenantId: string,
    endpoint: string,
    resourceType: string,
    quantity: number = 1
  ): Promise<void> {
    // In production, this would integrate with a billing system
    const usage = {
      tenantId,
      endpoint,
      resourceType,
      quantity,
      timestamp: new Date(),
    }
    
    // Log for now, would store in usage tracking table
    console.log('Usage tracked:', usage)
  }

  /**
   * Check if tenant has exceeded usage limits
   */
  static async checkUsageLimit(
    tenantId: string,
    resourceType: string
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, monthlyVisitors: true },
    })

    if (!tenant) {
      return { allowed: false, remaining: 0, limit: 0 }
    }

    // Define limits based on plan
    const limits = {
      STARTER: { visitors: 50000, tests: 5, projects: 3 },
      GROWTH: { visitors: 200000, tests: 20, projects: 10 },
      SCALE: { visitors: 1000000, tests: 100, projects: 50 },
      ENTERPRISE: { visitors: -1, tests: -1, projects: -1 }, // Unlimited
    }

    const planLimits = limits[tenant.plan] || limits.STARTER
    const limit = planLimits[resourceType as keyof typeof planLimits] || 0
    
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 }
    }

    // Get current usage (simplified)
    let currentUsage = 0
    if (resourceType === 'visitors') {
      currentUsage = tenant.monthlyVisitors
    }

    const remaining = Math.max(0, limit - currentUsage)
    const allowed = currentUsage < limit

    return { allowed, remaining, limit }
  }
}

export default TenantAwarePrisma