import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasPermission, PERMISSIONS } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createChecklistSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  regulationId: z.string().cuid(),
  dueDate: z.string().datetime().optional(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL', 'AD_HOC']).optional(),
});

// GET /api/checklists - Get user's checklists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const regulationId = searchParams.get('regulationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (regulationId) {
      where.regulationId = regulationId;
    }

    const [checklists, total] = await Promise.all([
      prisma.checklist.findMany({
        where,
        include: {
          regulation: {
            select: {
              name: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.checklist.count({ where }),
    ]);

    // Calculate completion status for each checklist
    const checklistsWithStatus = checklists.map((checklist) => {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(item => item.status === 'COMPLETED').length;
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        ...checklist,
        completionRate: Math.round(completionRate),
        totalItems,
        completedItems,
      };
    });

    return NextResponse.json({
      checklists: checklistsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/checklists - Create new checklist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_CHECKLISTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createChecklistSchema.parse(body);

    // Verify regulation exists and user has access
    const regulation = await prisma.regulation.findUnique({
      where: { id: validatedData.regulationId },
    });

    if (!regulation) {
      return NextResponse.json(
        { error: 'Regulation not found' },
        { status: 404 }
      );
    }

    // Create checklist
    const checklist = await prisma.checklist.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        regulationId: validatedData.regulationId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        isRecurring: validatedData.isRecurring,
        frequency: validatedData.frequency,
        nextDueDate: validatedData.isRecurring && validatedData.dueDate 
          ? calculateNextDueDate(new Date(validatedData.dueDate), validatedData.frequency!)
          : null,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        status: 'DRAFT',
      },
      include: {
        regulation: {
          select: {
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CHECKLIST_CREATED',
        entity: 'checklist',
        entityId: checklist.id,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        changes: {
          title: checklist.title,
          regulationId: checklist.regulationId,
        },
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'SEMI_ANNUAL':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'ANNUAL':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'BIENNIAL':
      nextDate.setFullYear(nextDate.getFullYear() + 2);
      break;
    default:
      return nextDate;
  }

  return nextDate;
}