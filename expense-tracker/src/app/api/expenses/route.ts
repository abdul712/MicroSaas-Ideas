import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, Permission, checkPermission } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// Validation schema for expense creation/update
const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']).optional().default('USD'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  merchantName: z.string().max(100, 'Merchant name too long').optional(),
  expenseDate: z.string().transform((str) => new Date(str)),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  projectId: z.string().uuid('Invalid project ID').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  tags: z.array(z.string()).optional().default([]),
  location: z.string().max(255, 'Location too long').optional(),
  mileage: z.number().positive('Mileage must be positive').optional(),
  mileageRate: z.number().positive('Mileage rate must be positive').optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().positive().default(1),
    endDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
})

const querySchema = z.object({
  page: z.string().optional().default('1').transform((val) => parseInt(val)),
  limit: z.string().optional().default('20').transform((val) => Math.min(parseInt(val), 100)),
  categoryId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  minAmount: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'merchant', 'category']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.WRITE_EXPENSES)

    const body = await request.json()
    const validatedData = expenseSchema.parse(body)

    // Check if category belongs to the organization
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: validatedData.categoryId,
          organizationId: session.user.organizationId,
        },
      })
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Check if project belongs to the organization
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: {
          id: validatedData.projectId,
          organizationId: session.user.organizationId,
        },
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Calculate base currency amount (assuming USD for now)
    const amountInBaseCurrency = validatedData.amount // TODO: Add currency conversion

    // Calculate mileage amount if provided
    let mileageAmount = 0
    if (validatedData.mileage && validatedData.mileageRate) {
      mileageAmount = validatedData.mileage * validatedData.mileageRate
    }

    const totalAmount = validatedData.amount + mileageAmount

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        amount: totalAmount,
        currency: validatedData.currency,
        amountInBaseCurrency: totalAmount, // TODO: Convert to organization's base currency
        description: validatedData.description,
        merchantName: validatedData.merchantName,
        expenseDate: validatedData.expenseDate,
        notes: validatedData.notes,
        tags: validatedData.tags,
        location: validatedData.location,
        mileage: validatedData.mileage,
        mileageRate: validatedData.mileageRate,
        isRecurring: validatedData.isRecurring,
        recurringPattern: validatedData.recurringPattern,
        status: 'DRAFT',
        organizationId: session.user.organizationId,
        userId: session.user.id,
        categoryId: validatedData.categoryId,
        projectId: validatedData.projectId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            clientName: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'Expense',
        resourceId: expense.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        newValues: {
          amount: expense.amount,
          description: expense.description,
          merchantName: expense.merchantName,
          categoryId: expense.categoryId,
          projectId: expense.projectId,
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get expenses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.READ_EXPENSES)

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    // Role-based access control
    if (session.user.role === 'USER') {
      where.userId = session.user.id
    } else if (query.userId) {
      where.userId = query.userId
    }

    // Apply filters
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.projectId) where.projectId = query.projectId
    if (query.status) where.status = query.status
    
    if (query.startDate || query.endDate) {
      where.expenseDate = {}
      if (query.startDate) where.expenseDate.gte = query.startDate
      if (query.endDate) where.expenseDate.lte = query.endDate
    }

    if (query.minAmount || query.maxAmount) {
      where.amountInBaseCurrency = {}
      if (query.minAmount) where.amountInBaseCurrency.gte = query.minAmount
      if (query.maxAmount) where.amountInBaseCurrency.lte = query.maxAmount
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { merchantName: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    // Build order by
    const orderBy: any = {}
    switch (query.sortBy) {
      case 'date':
        orderBy.expenseDate = query.sortOrder
        break
      case 'amount':
        orderBy.amountInBaseCurrency = query.sortOrder
        break
      case 'merchant':
        orderBy.merchantName = query.sortOrder
        break
      case 'category':
        orderBy.category = { name: query.sortOrder }
        break
      default:
        orderBy.expenseDate = 'desc'
    }

    const skip = (query.page - 1) * query.limit

    // Execute queries in parallel
    const [expenses, totalCount, analytics] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
              taxDeductible: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              clientName: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
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
        orderBy,
        skip,
        take: query.limit,
      }),
      prisma.expense.count({ where }),
      // Get summary analytics for the current filter
      prisma.expense.aggregate({
        where,
        _sum: { amountInBaseCurrency: true },
        _count: true,
      }),
    ])

    const response = {
      data: expenses.map(expense => ({
        id: expense.id,
        amount: expense.amount,
        currency: expense.currency,
        amountInBaseCurrency: expense.amountInBaseCurrency,
        description: expense.description,
        merchantName: expense.merchantName,
        expenseDate: expense.expenseDate,
        status: expense.status,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        mileage: expense.mileage,
        mileageRate: expense.mileageRate,
        isRecurring: expense.isRecurring,
        category: expense.category,
        project: expense.project,
        user: expense.user ? `${expense.user.firstName} ${expense.user.lastName}`.trim() : null,
        receipts: expense.receipts,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / query.limit),
      },
      analytics: {
        totalAmount: analytics._sum.amountInBaseCurrency || 0,
        totalCount: analytics._count,
        averageAmount: analytics._count > 0 
          ? (analytics._sum.amountInBaseCurrency || 0) / analytics._count 
          : 0,
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}