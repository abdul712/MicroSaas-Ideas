import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utilities
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() }
  }
}

// Transaction wrapper with retry logic
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: 'ReadCommitted',
      })
    } catch (error) {
      lastError = error as Error
      console.warn(`Transaction attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// Pagination helper
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function paginate<T>(
  model: any,
  options: PaginationOptions & { where?: any; orderBy?: any; include?: any },
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1)
  const limit = Math.min(100, Math.max(1, options.limit || 20))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      skip,
      take: limit,
    }),
    model.count({ where: options.where }),
  ])

  const pages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  }
}

// Soft delete utilities
export async function softDelete(model: any, id: string) {
  return model.update({
    where: { id },
    data: { 
      isActive: false,
      updatedAt: new Date(),
    },
  })
}

export async function softDeleteMany(model: any, where: any) {
  return model.updateMany({
    where,
    data: { 
      isActive: false,
      updatedAt: new Date(),
    },
  })
}

// Search utilities
export function buildSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm) return {}

  const searchConditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }))

  return {
    OR: searchConditions,
  }
}

// Audit log helper
export async function createAuditLog(
  organizationId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
) {
  return prisma.activity.create({
    data: {
      type: 'TICKET_UPDATED', // This would be dynamic based on action
      action,
      metadata: {
        resourceType,
        resourceId,
        ...metadata,
      },
      userId,
    },
  })
}

// Clean up old records
export async function cleanupOldRecords() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Clean up old sessions
  await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  })

  // Clean up old webhook deliveries
  await prisma.webhookDelivery.deleteMany({
    where: {
      deliveredAt: {
        lt: thirtyDaysAgo,
      },
    },
  })

  console.log('✅ Old records cleaned up')
}