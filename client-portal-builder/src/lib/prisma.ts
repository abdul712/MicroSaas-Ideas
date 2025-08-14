import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Helper function to handle Prisma errors
export const handlePrismaError = (error: any) => {
  if (error.code === 'P2002') {
    return 'A record with this information already exists.'
  }
  if (error.code === 'P2025') {
    return 'Record not found.'
  }
  if (error.code === 'P2003') {
    return 'Invalid reference to related record.'
  }
  return 'An unexpected database error occurred.'
}

// Connection test
export const testConnection = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export const disconnect = async () => {
  await prisma.$disconnect()
}