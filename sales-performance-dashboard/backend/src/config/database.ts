import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'

// Prisma client configuration with connection pooling and logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
  errorFormat: 'pretty',
})

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: e.duration
    })
  })
}

// Log database errors
prisma.$on('error', (e) => {
  logger.error('Database Error', { error: e })
})

// Log database info
prisma.$on('info', (e) => {
  logger.info('Database Info', { message: e.message })
})

// Log database warnings
prisma.$on('warn', (e) => {
  logger.warn('Database Warning', { message: e.message })
})

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Database connection is healthy')
    return true
  } catch (error) {
    logger.error('Database connection failed', { error })
    return false
  }
}

// Graceful disconnect
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from database', { error })
  }
}

// Multi-tenant query helper
export const withTenant = (tenantId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Add tenantId filter to all queries for multi-tenant models
          const multiTenantModels = [
            'User',
            'Organization',
            'SalesMetric',
            'Customer',
            'Product',
            'Dashboard',
            'Alert',
            'Report',
            'Integration',
            'AuditLog'
          ]

          if (multiTenantModels.includes(model)) {
            if (operation === 'findMany' || operation === 'findFirst') {
              args.where = { ...args.where, tenantId }
            } else if (operation === 'create') {
              args.data = { ...args.data, tenantId }
            } else if (operation === 'createMany') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({ ...item, tenantId }))
              } else {
                args.data = { ...args.data, tenantId }
              }
            } else if (operation === 'update' || operation === 'updateMany') {
              args.where = { ...args.where, tenantId }
            } else if (operation === 'delete' || operation === 'deleteMany') {
              args.where = { ...args.where, tenantId }
            } else if (operation === 'upsert') {
              args.where = { ...args.where, tenantId }
              args.create = { ...args.create, tenantId }
            }
          }

          return query(args)
        },
      },
    },
  })
}

// Database transaction helper
export const transaction = async <T>(
  operations: (tx: any) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(operations, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: 'ReadCommitted'
  })
}

// Soft delete helper
export const softDelete = async (
  model: any,
  where: Record<string, any>
): Promise<any> => {
  return await model.update({
    where,
    data: {
      deletedAt: new Date(),
      isDeleted: true
    }
  })
}

// Bulk operations helper
export const bulkOperation = async (
  operations: any[],
  batchSize: number = 1000
): Promise<any[]> => {
  const results = []
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch)
    results.push(...batchResults)
  }
  
  return results
}

// Raw query helper with logging
export const rawQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const startTime = Date.now()
  
  try {
    const result = await prisma.$queryRawUnsafe<T[]>(query, ...params)
    const duration = Date.now() - startTime
    
    logger.debug('Raw Query Executed', {
      query,
      params,
      duration,
      resultCount: result.length
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Raw Query Failed', {
      query,
      params,
      duration,
      error
    })
    
    throw error
  }
}

// Schema validation helper
export const validateSchema = async (): Promise<boolean> => {
  try {
    // Check if all required tables exist
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    const requiredTables = [
      'Tenant',
      'User',
      'Organization',
      'SalesMetric',
      'Customer',
      'Product',
      'Dashboard',
      'Alert',
      'Report',
      'Integration',
      'AuditLog'
    ]
    
    const existingTables = tables.map(t => t.table_name)
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))
    
    if (missingTables.length > 0) {
      logger.error('Missing database tables', { missingTables })
      return false
    }
    
    logger.info('Database schema validation passed')
    return true
  } catch (error) {
    logger.error('Database schema validation failed', { error })
    return false
  }
}

// Performance monitoring
export const queryPerformance = {
  slowQueryThreshold: 1000, // 1 second
  
  logSlowQueries: true,
  
  trackQuery: (query: string, duration: number) => {
    if (duration > queryPerformance.slowQueryThreshold) {
      logger.warn('Slow Query Detected', {
        query,
        duration,
        threshold: queryPerformance.slowQueryThreshold
      })
    }
  }
}

export { prisma }