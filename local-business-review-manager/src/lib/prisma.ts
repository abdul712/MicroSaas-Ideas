import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Database transaction helper
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(fn)
}

// Pagination helper
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function createPaginationOptions(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 10))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

// Soft delete helper
export async function softDelete(model: any, id: string) {
  return await model.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// Audit log helper
export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  oldValues,
  newValues,
  metadata,
  ipAddress,
  userAgent,
}: {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: any
  newValues?: any
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  return await prisma.auditLog.create({
    data: {
      userId,
      action: action as any,
      resource,
      resourceId,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      ipAddress,
      userAgent,
    },
  })
}

// Multi-tenant data access helper
export function createTenantAwareQuery(tenantId?: string) {
  if (!tenantId) {
    throw new Error('Tenant ID is required for multi-tenant operations')
  }
  
  return {
    where: {
      tenantId,
    },
  }
}

// User permission checker
export async function checkUserPermission(
  userId: string,
  businessId: string,
  requiredRole?: string[]
): Promise<boolean> {
  const businessUser = await prisma.businessUser.findFirst({
    where: {
      userId,
      businessId,
    },
    include: {
      user: true,
    },
  })

  if (!businessUser) {
    return false
  }

  if (requiredRole && requiredRole.length > 0) {
    return requiredRole.includes(businessUser.role)
  }

  return true
}

// Review aggregation helpers
export async function getReviewSummary(businessId: string, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const reviews = await prisma.review.findMany({
    where: {
      businessId,
      reviewDate: {
        gte: startDate,
      },
    },
    select: {
      rating: true,
      sentiment: true,
      platform: true,
    },
  })

  const total = reviews.length
  const averageRating = total > 0 
    ? reviews.reduce((sum, review) => {
        const ratingValue = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].indexOf(review.rating) + 1
        return sum + ratingValue
      }, 0) / total
    : 0

  const ratingDistribution = {
    one: reviews.filter(r => r.rating === 'ONE').length,
    two: reviews.filter(r => r.rating === 'TWO').length,
    three: reviews.filter(r => r.rating === 'THREE').length,
    four: reviews.filter(r => r.rating === 'FOUR').length,
    five: reviews.filter(r => r.rating === 'FIVE').length,
  }

  const sentimentDistribution = {
    positive: reviews.filter(r => 
      r.sentiment === 'POSITIVE' || r.sentiment === 'VERY_POSITIVE'
    ).length,
    neutral: reviews.filter(r => r.sentiment === 'NEUTRAL').length,
    negative: reviews.filter(r => 
      r.sentiment === 'NEGATIVE' || r.sentiment === 'VERY_NEGATIVE'
    ).length,
  }

  const platformDistribution = reviews.reduce((acc, review) => {
    acc[review.platform] = (acc[review.platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    sentimentDistribution,
    platformDistribution,
  }
}

// Business analytics helper
export async function getBusinessAnalytics(businessId: string, period = 30) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - period)

  // Get review analytics
  const reviewAnalytics = await prisma.reviewAnalytics.findMany({
    where: {
      businessId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Calculate trends
  const currentPeriodReviews = reviewAnalytics.slice(0, Math.floor(period / 2))
  const previousPeriodReviews = reviewAnalytics.slice(Math.floor(period / 2))

  const currentAverage = currentPeriodReviews.length > 0
    ? currentPeriodReviews.reduce((sum, analytics) => sum + analytics.averageRating, 0) / currentPeriodReviews.length
    : 0

  const previousAverage = previousPeriodReviews.length > 0
    ? previousPeriodReviews.reduce((sum, analytics) => sum + analytics.averageRating, 0) / previousPeriodReviews.length
    : 0

  const trend = currentAverage - previousAverage

  return {
    analytics: reviewAnalytics,
    currentAverage: Math.round(currentAverage * 10) / 10,
    previousAverage: Math.round(previousAverage * 10) / 10,
    trend: Math.round(trend * 100) / 100,
    trendPercentage: previousAverage > 0 
      ? Math.round((trend / previousAverage) * 100 * 10) / 10
      : 0,
  }
}

// Cleanup utilities
export async function cleanupExpiredSessions() {
  const expiredDate = new Date()
  expiredDate.setDate(expiredDate.getDate() - 30) // 30 days old

  await prisma.session.deleteMany({
    where: {
      expires: {
        lt: expiredDate,
      },
    },
  })
}

export async function cleanupExpiredInvitations() {
  const expiredDate = new Date()
  expiredDate.setDate(expiredDate.getDate() - 7) // 7 days old

  await prisma.reviewInvitation.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: expiredDate,
      },
    },
    data: {
      status: 'EXPIRED',
    },
  })
}

// Search helpers
export function createSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm.trim()) {
    return {}
  }

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    })),
  }
}