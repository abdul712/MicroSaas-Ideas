import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const conversationCreateSchema = z.object({
  organizationId: z.string(),
  visitorId: z.string(),
  departmentId: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
})

const conversationUpdateSchema = z.object({
  status: z.enum(['WAITING', 'ACTIVE', 'RESOLVED', 'CLOSED']).optional(),
  assignedUserId: z.string().optional(),
  departmentId: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = conversationCreateSchema.parse(body)

    const conversation = await prisma.conversation.create({
      data: {
        organizationId: validatedData.organizationId,
        visitorId: validatedData.visitorId,
        departmentId: validatedData.departmentId,
        priority: validatedData.priority,
        status: 'WAITING',
      },
      include: {
        visitor: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          }
        },
        department: true,
        messages: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ conversation })

  } catch (error) {
    console.error('Error creating conversation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const assignedUserId = searchParams.get('assignedUserId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const where: any = {
      organizationId,
    }

    if (status) {
      where.status = status
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        visitor: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          }
        },
        department: true,
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: offset,
      take: limit,
    })

    const total = await prisma.conversation.count({ where })

    return NextResponse.json({ 
      conversations,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('id')
    const body = await request.json()
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const validatedData = conversationUpdateSchema.parse(body)

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        endedAt: validatedData.status === 'CLOSED' || validatedData.status === 'RESOLVED' 
          ? new Date() 
          : undefined
      },
      include: {
        visitor: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          }
        },
        department: true,
      }
    })

    return NextResponse.json({ conversation })

  } catch (error) {
    console.error('Error updating conversation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}