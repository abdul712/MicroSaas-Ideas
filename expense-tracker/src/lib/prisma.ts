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

// Custom error handling for Prisma operations
export class PrismaError extends Error {
  constructor(
    message: string,
    public code: string,
    public meta?: any
  ) {
    super(message)
    this.name = 'PrismaError'
  }
}

// Helper function to handle Prisma errors
export function handlePrismaError(error: any): PrismaError {
  if (error.code === 'P2002') {
    return new PrismaError(
      'A record with this information already exists',
      'UNIQUE_CONSTRAINT_VIOLATION',
      error.meta
    )
  }
  
  if (error.code === 'P2025') {
    return new PrismaError(
      'Record not found',
      'RECORD_NOT_FOUND',
      error.meta
    )
  }
  
  if (error.code === 'P2003') {
    return new PrismaError(
      'Foreign key constraint failed',
      'FOREIGN_KEY_VIOLATION',
      error.meta
    )
  }
  
  if (error.code === 'P2021') {
    return new PrismaError(
      'Table does not exist in the current database',
      'TABLE_NOT_EXISTS',
      error.meta
    )
  }
  
  return new PrismaError(
    error.message || 'Database operation failed',
    error.code || 'UNKNOWN_ERROR',
    error.meta
  )
}

// Database connection test
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Multi-tenant helper functions
export async function getOrganizationById(id: string) {
  try {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            receipts: true,
            reports: true,
          },
        },
      },
    })
  } catch (error) {
    throw handlePrismaError(error)
  }
}

export async function getUserWithOrganization(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            settings: true,
          },
        },
      },
    })
  } catch (error) {
    throw handlePrismaError(error)
  }
}

// Expense query helpers
export async function getExpensesForOrganization(
  organizationId: string,
  filters?: {
    userId?: string
    categoryId?: string
    projectId?: string
    status?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
) {
  try {
    const where: any = { organizationId }
    
    if (filters?.userId) where.userId = filters.userId
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.projectId) where.projectId = filters.projectId
    if (filters?.status) where.status = filters.status
    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {}
      if (filters.startDate) where.expenseDate.gte = filters.startDate
      if (filters.endDate) where.expenseDate.lte = filters.endDate
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
        project: {
          select: {
            name: true,
            clientName: true,
          },
        },
        receipts: {
          select: {
            id: true,
            filename: true,
            thumbnailUrl: true,
            ocrStatus: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    })

    return expenses
  } catch (error) {
    throw handlePrismaError(error)
  }
}

// Analytics helpers
export async function getExpenseAnalytics(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const [totalExpenses, expensesByCategory, expensesByMonth, expensesByStatus] = 
      await Promise.all([
        // Total expenses
        prisma.expense.aggregate({
          where: {
            organizationId,
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amountInBaseCurrency: true },
          _count: true,
        }),

        // Expenses by category
        prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            organizationId,
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
            categoryId: { not: null },
          },
          _sum: { amountInBaseCurrency: true },
          _count: true,
        }),

        // Expenses by month
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "expenseDate") as month,
            SUM("amountInBaseCurrency") as total,
            COUNT(*) as count
          FROM "expenses"
          WHERE 
            "organizationId" = ${organizationId}
            AND "expenseDate" >= ${startDate}
            AND "expenseDate" <= ${endDate}
          GROUP BY DATE_TRUNC('month', "expenseDate")
          ORDER BY month
        `,

        // Expenses by status
        prisma.expense.groupBy({
          by: ['status'],
          where: {
            organizationId,
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amountInBaseCurrency: true },
          _count: true,
        }),
      ])

    return {
      totalExpenses,
      expensesByCategory,
      expensesByMonth,
      expensesByStatus,
    }
  } catch (error) {
    throw handlePrismaError(error)
  }
}

export default prisma