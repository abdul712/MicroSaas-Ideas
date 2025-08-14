import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, Permission, checkPermission } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']).optional(),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long').optional(),
  merchantName: z.string().max(100, 'Merchant name too long').optional(),
  expenseDate: z.string().transform((str) => new Date(str)).optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  projectId: z.string().uuid('Invalid project ID').nullable().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().max(255, 'Location too long').optional(),
  mileage: z.number().positive('Mileage must be positive').nullable().optional(),
  mileageRate: z.number().positive('Mileage rate must be positive').nullable().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
})

// Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.READ_EXPENSES)

    const expense = await prisma.expense.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        // Users can only access their own expenses unless they're admin
        ...(session.user.role === 'USER' ? { userId: session.user.id } : {}),
      },
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
            budget: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receipts: {
          select: {
            id: true,
            filename: true,
            originalFilename: true,
            fileUrl: true,
            thumbnailUrl: true,
            ocrStatus: true,
            extractedAmount: true,
            extractedDate: true,
            extractedMerchant: true,
            confidence: true,
            createdAt: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)

  } catch (error) {
    console.error('Get expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.WRITE_EXPENSES)

    // Get existing expense to check ownership and current state
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        // Users can only update their own expenses unless they're admin
        ...(session.user.role === 'USER' ? { userId: session.user.id } : {}),
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense can be modified
    if (existingExpense.status === 'APPROVED' || existingExpense.status === 'REIMBURSED') {
      // Only admins can modify approved/reimbursed expenses
      if (session.user.role === 'USER') {
        return NextResponse.json(
          { error: 'Cannot modify approved or reimbursed expenses' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const validatedData = updateExpenseSchema.parse(body)

    // Validate category ownership
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

    // Validate project ownership
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

    // Prepare update data
    const updateData: any = { ...validatedData }

    // Recalculate total amount if amount, mileage, or mileageRate changed
    if (validatedData.amount !== undefined || validatedData.mileage !== undefined || validatedData.mileageRate !== undefined) {
      const amount = validatedData.amount ?? existingExpense.amount
      const mileage = validatedData.mileage ?? existingExpense.mileage ?? 0
      const mileageRate = validatedData.mileageRate ?? existingExpense.mileageRate ?? 0
      
      const mileageAmount = mileage * mileageRate
      const totalAmount = Number(amount) + mileageAmount
      
      updateData.amount = totalAmount
      updateData.amountInBaseCurrency = totalAmount // TODO: Convert to base currency
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
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
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'Expense',
        resourceId: updatedExpense.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        oldValues: {
          amount: existingExpense.amount,
          description: existingExpense.description,
          status: existingExpense.status,
        },
        newValues: {
          amount: updatedExpense.amount,
          description: updatedExpense.description,
          status: updatedExpense.status,
        },
      },
    })

    return NextResponse.json(updatedExpense)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.DELETE_EXPENSES)

    // Get existing expense to check ownership and current state
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
        // Users can only delete their own expenses unless they're admin
        ...(session.user.role === 'USER' ? { userId: session.user.id } : {}),
      },
      include: {
        receipts: true,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense can be deleted
    if (existingExpense.status === 'APPROVED' || existingExpense.status === 'REIMBURSED') {
      // Only admins can delete approved/reimbursed expenses
      if (session.user.role === 'USER') {
        return NextResponse.json(
          { error: 'Cannot delete approved or reimbursed expenses' },
          { status: 403 }
        )
      }
    }

    // Delete expense (receipts will be unlinked due to ON DELETE SET NULL)
    await prisma.expense.delete({
      where: { id: params.id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'Expense',
        resourceId: params.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        oldValues: {
          amount: existingExpense.amount,
          description: existingExpense.description,
          status: existingExpense.status,
          receiptCount: existingExpense.receipts.length,
        },
      },
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })

  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Expense status management (submit, approve, reject, reimburse)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notes } = body

    if (!['submit', 'approve', 'reject', 'reimburse'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get existing expense
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check permissions and state transitions
    let newStatus: string
    let requiredPermission: Permission

    switch (action) {
      case 'submit':
        if (existingExpense.status !== 'DRAFT') {
          return NextResponse.json(
            { error: 'Can only submit draft expenses' },
            { status: 400 }
          )
        }
        if (existingExpense.userId !== session.user.id && session.user.role === 'USER') {
          return NextResponse.json(
            { error: 'Can only submit your own expenses' },
            { status: 403 }
          )
        }
        newStatus = 'SUBMITTED'
        requiredPermission = Permission.WRITE_EXPENSES
        break

      case 'approve':
        if (existingExpense.status !== 'SUBMITTED') {
          return NextResponse.json(
            { error: 'Can only approve submitted expenses' },
            { status: 400 }
          )
        }
        newStatus = 'APPROVED'
        requiredPermission = Permission.APPROVE_EXPENSES
        break

      case 'reject':
        if (!['SUBMITTED', 'APPROVED'].includes(existingExpense.status)) {
          return NextResponse.json(
            { error: 'Can only reject submitted or approved expenses' },
            { status: 400 }
          )
        }
        newStatus = 'REJECTED'
        requiredPermission = Permission.APPROVE_EXPENSES
        break

      case 'reimburse':
        if (existingExpense.status !== 'APPROVED') {
          return NextResponse.json(
            { error: 'Can only reimburse approved expenses' },
            { status: 400 }
          )
        }
        newStatus = 'REIMBURSED'
        requiredPermission = Permission.APPROVE_EXPENSES
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    checkPermission(session.user.role, requiredPermission)

    // Update expense status
    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        status: newStatus as any,
        ...(notes && { notes: notes }),
      },
      include: {
        category: true,
        project: true,
        user: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'Expense',
        resourceId: updatedExpense.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        oldValues: {
          status: existingExpense.status,
        },
        newValues: {
          status: newStatus,
          action: action,
          notes: notes,
        },
      },
    })

    return NextResponse.json({
      message: `Expense ${action}ed successfully`,
      expense: updatedExpense,
    })

  } catch (error) {
    console.error('Expense status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}