import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, Permission, checkPermission } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(255, 'Description too long').optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
  icon: z.string().max(10, 'Icon too long').optional(),
  taxDeductible: z.boolean().optional().default(false),
  parentId: z.string().uuid('Invalid parent ID').optional(),
})

// Get categories for organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    checkPermission(session.user.role, Permission.READ_EXPENSES)

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const parentId = searchParams.get('parentId')

    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (!includeInactive) {
      where.isActive = true
    }

    if (parentId) {
      where.parentId = parentId
    } else if (parentId !== 'all') {
      // By default, only return top-level categories (parentId is null)
      where.parentId = null
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            taxDeductible: true,
          },
        },
        _count: {
          select: {
            expenses: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { name: 'asc' },
      ],
    })

    return NextResponse.json(categories)

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create categories
    if (session.user.role === 'USER') {
      return NextResponse.json(
        { error: 'Only administrators can create categories' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Check if category name already exists in organization
    const existingCategory = await prisma.category.findUnique({
      where: {
        name_organizationId: {
          name: validatedData.name,
          organizationId: session.user.organizationId,
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Check parent category exists and belongs to organization
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: {
          id: validatedData.parentId,
          organizationId: session.user.organizationId,
        },
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
      },
      include: {
        children: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'Category',
        resourceId: category.id,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        newValues: {
          name: category.name,
          taxDeductible: category.taxDeductible,
          parentId: category.parentId,
        },
      },
    })

    return NextResponse.json(category, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}