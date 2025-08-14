import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Row Level Security - Multi-tenant helper
export const withOrganizationFilter = (organizationId: string) => {
  return {
    where: {
      organizationId,
    },
  }
}

// Utility functions for multi-tenant operations
export const createWithOrganization = (data: any, organizationId: string) => {
  return {
    ...data,
    organizationId,
  }
}

export const updateWithOrganization = (data: any, organizationId: string, id: string) => {
  return {
    where: {
      id,
      organizationId,
    },
    data,
  }
}

export const deleteWithOrganization = (organizationId: string, id: string) => {
  return {
    where: {
      id,
      organizationId,
    },
  }
}

// Database connection helpers
export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('🔗 Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export const disconnectDB = async () => {
  try {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}