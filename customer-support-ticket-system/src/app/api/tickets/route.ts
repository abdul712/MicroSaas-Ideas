import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { generateTicketNumber } from '@/lib/utils'
import { z } from 'zod'

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  source: z.enum(['EMAIL', 'WEB_FORM', 'CHAT', 'PHONE', 'SOCIAL', 'API']).default('WEB_FORM'),
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  departmentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/tickets - List tickets with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedAgentId = searchParams.get('assignedAgentId')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedAgentId) where.assignedAgentId = assignedAgentId
    if (departmentId) where.departmentId = departmentId
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get tickets with related data
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          department: {
            select: { id: true, name: true, color: true },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTicketSchema.parse(body)

    // Generate unique ticket number
    const ticketNumber = generateTicketNumber()

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority,
        source: validatedData.source,
        customerEmail: validatedData.customerEmail,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        departmentId: validatedData.departmentId,
        status: 'OPEN',
      },
      include: {
        assignedAgent: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        department: {
          select: { id: true, name: true, color: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Add tags if provided
    if (validatedData.tags && validatedData.tags.length > 0) {
      // Create or get existing tags
      const tagPromises = validatedData.tags.map(async (tagName) => {
        return prisma.tag.upsert({
          where: {
            name_organizationId: {
              name: tagName,
              organizationId: session.user.organizationId,
            },
          },
          create: {
            name: tagName,
            organizationId: session.user.organizationId,
          },
          update: {},
        })
      })

      const tags = await Promise.all(tagPromises)

      // Link tags to ticket
      await prisma.ticketTag.createMany({
        data: tags.map((tag) => ({
          ticketId: ticket.id,
          tagId: tag.id,
        })),
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CREATED',
        description: `Ticket created by ${session.user.name || session.user.email}`,
        ticketId: ticket.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}