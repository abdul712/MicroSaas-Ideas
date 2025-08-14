import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions, requireAuth } from '@/lib/auth'
import { prisma, paginate } from '@/lib/prisma'
import { generateTicketNumber, buildSearchQuery } from '@/lib/utils'
import { TicketStatus, Priority, TicketSource } from '@prisma/client'

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  source: z.enum(['EMAIL', 'WEB_FORM', 'CHAT', 'PHONE', 'SOCIAL', 'API', 'WIDGET']).default('WEB_FORM'),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  tags: z.array(z.string()).default([]),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  customFields: z.record(z.any()).default({}),
})

const ticketQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'PENDING', 'SOLVED', 'CLOSED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// GET /api/tickets - List tickets with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = await requireAuth('AGENT')(session)

    const { searchParams } = new URL(request.url)
    const query = ticketQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      assigneeId: searchParams.get('assigneeId'),
      teamId: searchParams.get('teamId'),
      search: searchParams.get('search'),
      tags: searchParams.getAll('tags'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.priority) {
      where.priority = query.priority
    }

    if (query.assigneeId) {
      where.assignedToId = query.assigneeId
    }

    if (query.teamId) {
      where.teamId = query.teamId
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { email: { contains: query.search, mode: 'insensitive' } } },
      ]
    }

    if (query.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: query.tags }
          }
        }
      }
    }

    // Build order by
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    }

    // Include related data
    const include = {
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
          attachments: true,
        },
      },
    }

    const result = await paginate(prisma.ticket, {
      where,
      orderBy,
      include,
      page: query.page,
      limit: query.limit,
    })

    // Transform the data
    const transformedData = result.data.map(ticket => ({
      ...ticket,
      tags: ticket.tags.map(t => t.tag),
      messageCount: ticket._count.messages,
      attachmentCount: ticket._count.attachments,
      _count: undefined,
    }))

    return NextResponse.json({
      ...result,
      data: transformedData,
    })

  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = await requireAuth('AGENT')(session)

    const body = await request.json()
    const data = createTicketSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = null
      if (data.customerEmail) {
        customer = await tx.customer.findUnique({
          where: {
            email_organizationId: {
              email: data.customerEmail,
              organizationId: user.organizationId,
            },
          },
        })

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              email: data.customerEmail,
              name: data.customerName || data.customerEmail.split('@')[0],
              organizationId: user.organizationId,
            },
          })
        }
      }

      // Generate unique ticket number
      let ticketNumber = generateTicketNumber()
      let existingTicket = await tx.ticket.findUnique({
        where: { number: ticketNumber },
      })
      
      while (existingTicket) {
        ticketNumber = generateTicketNumber()
        existingTicket = await tx.ticket.findUnique({
          where: { number: ticketNumber },
        })
      }

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          number: ticketNumber,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          source: data.source,
          status: 'OPEN',
          organizationId: user.organizationId,
          customerId: customer?.id,
          assignedToId: data.assigneeId,
          teamId: data.teamId,
          createdById: user.id,
        },
        include: {
          customer: true,
          assignedTo: true,
          team: true,
        },
      })

      // Add tags if provided
      if (data.tags.length > 0) {
        const tags = await tx.tag.findMany({
          where: {
            name: { in: data.tags },
            organizationId: user.organizationId,
          },
        })

        await tx.ticketTag.createMany({
          data: tags.map(tag => ({
            ticketId: ticket.id,
            tagId: tag.id,
          })),
        })
      }

      // Add custom field values if provided
      if (Object.keys(data.customFields).length > 0) {
        const customFields = await tx.customField.findMany({
          where: {
            organizationId: user.organizationId,
            isActive: true,
          },
        })

        const customFieldValues = customFields
          .filter(field => data.customFields[field.name] !== undefined)
          .map(field => ({
            fieldId: field.id,
            ticketId: ticket.id,
            value: data.customFields[field.name],
          }))

        if (customFieldValues.length > 0) {
          await tx.customFieldValue.createMany({
            data: customFieldValues,
          })
        }
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'TICKET_CREATED',
          action: 'created',
          metadata: {
            ticketNumber: ticket.number,
            subject: ticket.subject,
            priority: ticket.priority,
          },
          ticketId: ticket.id,
          userId: user.id,
        },
      })

      return ticket
    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Create ticket error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}