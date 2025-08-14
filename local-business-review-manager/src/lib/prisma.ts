import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString() 
    }
  }
}

// Database migration check
export async function checkMigrationStatus() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '_prisma_migrations'
    ` as Array<{ table_name: string }>
    
    if (result.length === 0) {
      return { status: 'no_migrations', migrated: false }
    }
    
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, failed, rolled_back_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10
    ` as Array<{
      migration_name: string
      finished_at: Date | null
      failed: boolean
      rolled_back_at: Date | null
    }>
    
    const pendingMigrations = migrations.filter(m => !m.finished_at || m.failed)
    
    return {
      status: pendingMigrations.length > 0 ? 'pending' : 'up_to_date',
      migrated: pendingMigrations.length === 0,
      recent_migrations: migrations.slice(0, 5),
      pending_count: pendingMigrations.length
    }
  } catch (error) {
    return { 
      status: 'error', 
      migrated: false,
      error: error instanceof Error ? error.message : 'Unknown migration check error'
    }
  }
}

// Cleanup function for graceful shutdown
export async function closeDatabaseConnection() {
  await prisma.$disconnect()
}

// Performance monitoring
export async function getDatabaseStats() {
  try {
    const [tableStats, connectionStats] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          avg_width,
          n_dead_tup,
          n_live_tup
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `,
      prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `
    ])
    
    return {
      table_stats: tableStats,
      connection_stats: connectionStats,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get database stats',
      timestamp: new Date().toISOString()
    }
  }
}

// Security: Audit log helpers
export async function createAuditLog(
  entityType: string,
  entityId: string,
  action: string,
  changes?: any,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    return await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        changes: changes || {},
        userId,
        ipAddress,
        userAgent,
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    throw error
  }
}

export async function getRecentAuditLogs(
  entityType?: string,
  entityId?: string,
  limit: number = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        ...(entityType && { entityType }),
        ...(entityId && { entityId })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    throw error
  }
}

// Tenant isolation helpers
export function createTenantContext(businessId: string) {
  return {
    business: {
      where: {
        id: businessId
      },
      include: {
        locations: true,
        owner: true
      }
    },
    locations: {
      where: {
        businessId
      }
    },
    reviews: {
      where: {
        location: {
          businessId
        }
      }
    }
  }
}

// Data export helpers for GDPR compliance
export async function exportBusinessData(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        locations: {
          include: {
            reviews: {
              include: {
                responses: true
              }
            }
          }
        },
        reviewTemplates: true,
        alertSettings: true,
        analyticsReports: true,
        integrationTokens: {
          select: {
            platform: true,
            isActive: true,
            lastSyncAt: true,
            syncStatus: true,
            createdAt: true
          }
        }
      }
    })
    
    return business
  } catch (error) {
    console.error('Failed to export business data:', error)
    throw error
  }
}

export async function deleteBusinessData(businessId: string) {
  try {
    // This will cascade delete all related data due to Prisma relations
    const deletedBusiness = await prisma.business.delete({
      where: { id: businessId }
    })
    
    // Create audit log for GDPR deletion
    await createAuditLog(
      'BUSINESS',
      businessId,
      'GDPR_DELETION',
      { deleted_at: new Date().toISOString() }
    )
    
    return deletedBusiness
  } catch (error) {
    console.error('Failed to delete business data:', error)
    throw error
  }
}

// Health check endpoint data
export async function getSystemHealth() {
  const dbHealth = await checkDatabaseConnection()
  const migrationStatus = await checkMigrationStatus()
  
  return {
    database: dbHealth,
    migrations: migrationStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }
}