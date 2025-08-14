import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  organizationId: z.string().cuid('Invalid organization ID'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check if user has access to the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        orgId: organizationId,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        orgId: organizationId,
      },
      include: {
        _count: {
          select: {
            feedback: true,
            widgets: true,
            forms: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, description, organizationId } = createProjectSchema.parse(body)

    // Check if user has admin access to the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        orgId: organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate unique slug
    const baseSlug = slugify(name)
    let slug = baseSlug
    let counter = 1

    while (await prisma.project.findFirst({ 
      where: { 
        orgId: organizationId,
        slug 
      } 
    })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        slug,
        orgId: organizationId,
        settings: {
          allowAnonymous: true,
          autoAnalysis: true,
          notifications: {
            email: true,
            slack: false,
          },
          dataRetention: 365, // days
        },
      },
      include: {
        _count: {
          select: {
            feedback: true,
            widgets: true,
            forms: true,
          },
        },
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Create project error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}