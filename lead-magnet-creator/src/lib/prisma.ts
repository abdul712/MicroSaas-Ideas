import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper functions for multi-tenant queries
export const withOrganization = (organizationId: string) => {
  return {
    where: {
      organizationId
    }
  }
}

// Row-level security helper
export const createSecureQuery = (userId: string, organizationId: string) => {
  return {
    where: {
      organizationId,
      // Add additional user-level filters as needed
    }
  }
}

// Transaction helpers
export const executeInTransaction = async <T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(fn)
}

// Performance optimization helpers
export const withCaching = {
  leadMagnets: {
    findMany: async (organizationId: string, options?: any) => {
      return await prisma.leadMagnet.findMany({
        ...options,
        where: {
          organizationId,
          ...options?.where
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              conversions: true,
              abTests: true
            }
          }
        }
      })
    }
  },
  
  templates: {
    findMany: async (organizationId?: string, isPublic = true) => {
      return await prisma.template.findMany({
        where: {
          OR: [
            { isPublic },
            { organizationId }
          ]
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    }
  },
  
  analytics: {
    getConversions: async (organizationId: string, period: string) => {
      return await prisma.conversion.findMany({
        where: {
          leadMagnet: {
            organizationId
          },
          convertedAt: {
            gte: getDateFromPeriod(period)
          }
        },
        include: {
          leadMagnet: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      })
    }
  }
}

// Utility functions
function getDateFromPeriod(period: string): Date {
  const now = new Date()
  
  switch (period) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
}

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Cleanup utilities
export const cleanup = async () => {
  await prisma.$disconnect()
}