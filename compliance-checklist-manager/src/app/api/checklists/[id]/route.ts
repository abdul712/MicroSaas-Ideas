import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasPermission, PERMISSIONS } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateChecklistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'ARCHIVED']).optional(),
  dueDate: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL', 'AD_HOC']).optional(),
});

interface Params {
  id: string;
}

// GET /api/checklists/[id] - Get specific checklist
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checklist = await prisma.checklist.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        regulation: {
          select: {
            name: true,
            code: true,
            authority: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            requirement: {
              select: {
                title: true,
                category: true,
                priority: true,
              },
            },
            assignedTo: {
              select: {
                name: true,
                email: true,
              },
            },
            completedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        complianceScores: {
          orderBy: {
            calculationDate: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    // Calculate completion statistics
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.status === 'COMPLETED').length;
    const inProgressItems = checklist.items.filter(item => item.status === 'IN_PROGRESS').length;
    const overdueItems = checklist.items.filter(item => 
      item.status !== 'COMPLETED' && item.dueDate && new Date(item.dueDate) < new Date()
    ).length;

    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return NextResponse.json({
      ...checklist,
      statistics: {
        totalItems,
        completedItems,
        inProgressItems,
        overdueItems,
        completionRate: Math.round(completionRate),
      },
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/checklists/[id] - Update checklist
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_CHECKLISTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateChecklistSchema.parse(body);

    // Get current checklist
    const currentChecklist = await prisma.checklist.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!currentChecklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const changes: any = {};

    if (validatedData.title && validatedData.title !== currentChecklist.title) {
      updateData.title = validatedData.title;
      changes.title = { from: currentChecklist.title, to: validatedData.title };
    }

    if (validatedData.description !== undefined && validatedData.description !== currentChecklist.description) {
      updateData.description = validatedData.description;
      changes.description = { from: currentChecklist.description, to: validatedData.description };
    }

    if (validatedData.status && validatedData.status !== currentChecklist.status) {
      updateData.status = validatedData.status;
      changes.status = { from: currentChecklist.status, to: validatedData.status };

      // Set completion date if status is completed
      if (validatedData.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        changes.completedAt = new Date();
      }
    }

    if (validatedData.dueDate) {
      const newDueDate = new Date(validatedData.dueDate);
      updateData.dueDate = newDueDate;
      changes.dueDate = { from: currentChecklist.dueDate, to: newDueDate };

      // Recalculate next due date if recurring
      if (currentChecklist.isRecurring && currentChecklist.frequency) {
        updateData.nextDueDate = calculateNextDueDate(newDueDate, currentChecklist.frequency);
      }
    }

    if (validatedData.isRecurring !== undefined && validatedData.isRecurring !== currentChecklist.isRecurring) {
      updateData.isRecurring = validatedData.isRecurring;
      changes.isRecurring = { from: currentChecklist.isRecurring, to: validatedData.isRecurring };
    }

    if (validatedData.frequency && validatedData.frequency !== currentChecklist.frequency) {
      updateData.frequency = validatedData.frequency;
      changes.frequency = { from: currentChecklist.frequency, to: validatedData.frequency };

      // Recalculate next due date
      if (currentChecklist.isRecurring && currentChecklist.dueDate) {
        updateData.nextDueDate = calculateNextDueDate(currentChecklist.dueDate, validatedData.frequency);
      }
    }

    // Update checklist
    const updatedChecklist = await prisma.checklist.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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

    // Create audit log if there were changes
    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'CHECKLIST_UPDATED',
          entity: 'checklist',
          entityId: params.id,
          organizationId: session.user.organizationId,
          userId: session.user.id,
          changes,
        },
      });
    }

    return NextResponse.json(updatedChecklist);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/checklists/[id] - Delete checklist
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_CHECKLISTS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if checklist exists and user has access
    const checklist = await prisma.checklist.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    // Delete checklist (this will cascade delete items due to foreign key constraints)
    await prisma.checklist.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CHECKLIST_DELETED',
        entity: 'checklist',
        entityId: params.id,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        changes: {
          title: checklist.title,
          status: checklist.status,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
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