import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { aiEmailGenerator } from '@/services/ai-email-generator'
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  category: z.string().default('general'),
  isPublic: z.boolean().default(false),
  variables: z.array(z.string()).optional(),
})

const UpdateTemplateSchema = CreateTemplateSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const where = {
      OR: [
        { userId: session.user.id },
        ...(isPublic ? [{ isPublic: true }] : []),
      ],
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { subject: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              emailSends: true,
              campaigns: true,
            },
          },
        },
      }),
      prisma.emailTemplate.count({ where }),
    ])

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateTemplateSchema.parse(body)

    // Extract variables from content if not provided
    const extractedVariables = [
      ...new Set([
        ...data.variables || [],
        // Extract variables from content would be implemented here
      ])
    ]

    const template = await prisma.emailTemplate.create({
      data: {
        ...data,
        variables: extractedVariables,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const body = await request.json()
    const data = UpdateTemplateSchema.parse(body)

    // Check if user owns the template
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    })

    if (!existingTemplate || existingTemplate.userId !== session.user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = await prisma.emailTemplate.update({
      where: { id: templateId },
      data,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Template update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if user owns the template
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            emailSends: true,
            sequenceSteps: true,
            campaigns: true,
          },
        },
      },
    })

    if (!existingTemplate || existingTemplate.userId !== session.user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if template is being used
    const usageCount = existingTemplate._count.emailSends + 
                      existingTemplate._count.sequenceSteps + 
                      existingTemplate._count.campaigns

    if (usageCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete template that is being used in sequences or campaigns' 
      }, { status: 409 })
    }

    await prisma.emailTemplate.delete({
      where: { id: templateId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}