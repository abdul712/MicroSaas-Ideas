import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const visitorCreateSchema = z.object({
  organizationId: z.string(),
  widgetId: z.string().optional(),
  identifier: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.record(z.any()).optional(),
  metadata: z.record(z.any()).default({}),
})

const visitorUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = visitorCreateSchema.parse(body)

    // Check if visitor already exists with same identifier or email
    let existingVisitor = null
    if (validatedData.identifier) {
      existingVisitor = await prisma.visitor.findFirst({
        where: {
          organizationId: validatedData.organizationId,
          identifier: validatedData.identifier,
        }
      })
    } else if (validatedData.email) {
      existingVisitor = await prisma.visitor.findFirst({
        where: {
          organizationId: validatedData.organizationId,
          email: validatedData.email,
        }
      })
    }

    if (existingVisitor) {
      // Update existing visitor
      const visitor = await prisma.visitor.update({
        where: { id: existingVisitor.id },
        data: {
          lastVisitAt: new Date(),
          ...validatedData,
        }
      })
      return NextResponse.json({ visitor, isNew: false })
    }

    // Create new visitor
    const visitor = await prisma.visitor.create({
      data: validatedData
    })

    return NextResponse.json({ visitor, isNew: true })

  } catch (error) {
    console.error('Error creating/updating visitor:', error)
    
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
    const visitorId = searchParams.get('id')
    const identifier = searchParams.get('identifier')
    const email = searchParams.get('email')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    // Get specific visitor
    if (visitorId || identifier || email) {
      const where: any = { organizationId }
      
      if (visitorId) where.id = visitorId
      else if (identifier) where.identifier = identifier
      else if (email) where.email = email

      const visitor = await prisma.visitor.findFirst({
        where,
        include: {
          conversations: {
            take: 5,
            orderBy: {
              startedAt: 'desc'
            },
            include: {
              messages: {
                take: 1,
                orderBy: {
                  createdAt: 'desc'
                }
              },
              _count: {
                select: {
                  messages: true
                }
              }
            }
          },
          _count: {
            select: {
              conversations: true
            }
          }
        }
      })

      if (!visitor) {
        return NextResponse.json(
          { error: 'Visitor not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ visitor })
    }

    // List visitors
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const visitors = await prisma.visitor.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        lastVisitAt: 'desc'
      },
      skip: offset,
      take: limit,
    })

    const total = await prisma.visitor.count({
      where: { organizationId }
    })

    return NextResponse.json({ 
      visitors,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching visitor(s):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get('id')
    const body = await request.json()
    
    if (!visitorId) {
      return NextResponse.json(
        { error: 'Visitor ID is required' },
        { status: 400 }
      )
    }

    const validatedData = visitorUpdateSchema.parse(body)

    const visitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ visitor })

  } catch (error) {
    console.error('Error updating visitor:', error)
    
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