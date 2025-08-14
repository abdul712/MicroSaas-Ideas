import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, withUserAccess } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for expense creation
const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('USD'),
  description: z.string().min(1, 'Description is required').max(500),
  merchantName: z.string().optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  expenseDate: z.string().datetime(),
  projectId: z.string().cuid().optional(),
  isTaxDeductible: z.boolean().default(false),
  businessPurpose: z.string().optional(),
  location: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'DIGITAL_WALLET', 'OTHER']).default('CASH'),
  tags: z.array(z.string()).default([]),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  project: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['expenseDate', 'amount', 'description', 'createdAt']).default('expenseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/expenses - List expenses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const skip = (query.page - 1) * query.limit;

    // Build where clause
    const where = {
      ...withUserAccess(session.user.id, session.user.organizationId),
      ...(query.category && { categoryId: query.category }),
      ...(query.project && { projectId: query.project }),
      ...(query.startDate || query.endDate) && {
        expenseDate: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) }),
        },
      },
      ...(query.search && {
        OR: [
          { description: { contains: query.search, mode: 'insensitive' as const } },
          { merchantName: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Execute queries in parallel
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true, isTaxDeductible: true },
          },
          project: {
            select: { id: true, name: true, clientName: true },
          },
          receipts: {
            select: { id: true, url: true, thumbnailUrl: true, ocrStatus: true },
          },
          _count: {
            select: { receipts: true },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    // Calculate summary statistics
    const totalAmount = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    const response = {
      expenses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / query.limit),
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        totalExpenses: totalCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    // Verify category exists and user has access
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        OR: [
          { isSystemCategory: true },
          withUserAccess(session.user.id, session.user.organizationId),
        ],
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    // Verify project exists if provided
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          ...withUserAccess(session.user.id, session.user.organizationId),
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        expenseDate: new Date(validatedData.expenseDate),
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true, isTaxDeductible: true },
        },
        project: {
          select: { id: true, name: true, clientName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Expense',
        entityId: expense.id,
        newValues: validatedData,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        expenseId: expense.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}