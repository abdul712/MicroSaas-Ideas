import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/services/email-service'
import { z } from 'zod'

const CreateContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  source: z.string().optional(),
})

const UpdateContactSchema = CreateContactSchema.partial()

const BulkImportSchema = z.object({
  contacts: z.array(CreateContactSchema),
  skipDuplicates: z.boolean().default(true),
  validateEmails: z.boolean().default(true),
})

const BulkActionSchema = z.object({
  contactIds: z.array(z.string()),
  action: z.enum(['add_tags', 'remove_tags', 'update_status', 'export', 'delete']),
  data: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const status = searchParams.get('status') as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'BLOCKED'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tags && tags.length > 0 && {
        tags: {
          hasSome: tags,
        },
      }),
    }

    const [contacts, total, statusCounts] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          emailSends: {
            select: {
              status: true,
              sentAt: true,
              openedAt: true,
              clickedAt: true,
            },
            orderBy: { sentAt: 'desc' },
            take: 5,
          },
          segments: {
            include: {
              segment: {
                select: { id: true, name: true },
              },
            },
          },
          interactions: {
            select: {
              type: true,
              timestamp: true,
            },
            orderBy: { timestamp: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              emailSends: true,
              interactions: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
      prisma.contact.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true,
      }),
    ])

    // Calculate engagement metrics for each contact
    const contactsWithMetrics = contacts.map(contact => {
      const emailSends = contact.emailSends
      const totalSent = emailSends.length
      const opened = emailSends.filter(send => send.openedAt).length
      const clicked = emailSends.filter(send => send.clickedAt).length

      return {
        ...contact,
        metrics: {
          totalEmailsSent: totalSent,
          openRate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
          clickRate: totalSent > 0 ? Math.round((clicked / totalSent) * 100) : 0,
          lastActivity: contact.interactions[0]?.timestamp || null,
          engagementScore: calculateEngagementScore(emailSends, contact.interactions),
        },
      }
    })

    const statusCountsMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      contacts: contactsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts: statusCountsMap,
    })
  } catch (error) {
    console.error('Contact fetch error:', error)
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
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'bulk-import':
        return await handleBulkImport(body, session.user.id)
      
      case 'bulk-action':
        return await handleBulkAction(body, session.user.id)
      
      default:
        return await handleSingleContact(body, session.user.id)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Contact creation error:', error)
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
    const contactId = searchParams.get('id')

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
    }

    const body = await request.json()
    const data = UpdateContactSchema.parse(body)

    // Check if user owns the contact
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId },
    })

    if (!existingContact || existingContact.userId !== session.user.id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // If email is being updated, validate it
    if (data.email && data.email !== existingContact.email) {
      const validation = await emailService.validateEmailDeliverability(data.email)
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Invalid email address', 
          details: validation.issues 
        }, { status: 400 })
      }
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        emailSends: {
          select: {
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
          },
          take: 5,
        },
        _count: {
          select: {
            emailSends: true,
            interactions: true,
          },
        },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Contact update error:', error)
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
    const contactId = searchParams.get('id')

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
    }

    // Check if user owns the contact
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        _count: {
          select: {
            emailSends: true,
          },
        },
      },
    })

    if (!existingContact || existingContact.userId !== session.user.id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // If contact has email history, just mark as deleted instead of hard delete
    if (existingContact._count.emailSends > 0) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { 
          status: 'BLOCKED',
          customFields: {
            ...existingContact.customFields as any,
            deletedAt: new Date().toISOString(),
          }
        },
      })
    } else {
      await prisma.contact.delete({
        where: { id: contactId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
async function handleSingleContact(body: any, userId: string) {
  const data = CreateContactSchema.parse(body)

  // Validate email deliverability
  const validation = await emailService.validateEmailDeliverability(data.email)
  if (!validation.isValid) {
    return NextResponse.json({ 
      error: 'Invalid email address', 
      details: validation.issues 
    }, { status: 400 })
  }

  // Check for duplicate
  const existing = await prisma.contact.findUnique({
    where: {
      email_userId: {
        email: data.email,
        userId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Contact already exists' }, { status: 409 })
  }

  const contact = await prisma.contact.create({
    data: {
      ...data,
      userId,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}

async function handleBulkImport(body: any, userId: string) {
  const data = BulkImportSchema.parse(body)
  
  const results = {
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [] as any[],
  }

  for (const contactData of data.contacts) {
    try {
      // Validate email if required
      if (data.validateEmails) {
        const validation = await emailService.validateEmailDeliverability(contactData.email)
        if (!validation.isValid) {
          results.failed++
          results.errors.push({
            email: contactData.email,
            error: 'Invalid email address',
            details: validation.issues,
          })
          continue
        }
      }

      // Check for duplicates
      const existing = await prisma.contact.findUnique({
        where: {
          email_userId: {
            email: contactData.email,
            userId,
          },
        },
      })

      if (existing && data.skipDuplicates) {
        results.skipped++
        continue
      }

      if (existing && !data.skipDuplicates) {
        // Update existing contact
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            ...contactData,
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new contact
        await prisma.contact.create({
          data: {
            ...contactData,
            userId,
          },
        })
      }

      results.imported++
    } catch (error) {
      results.failed++
      results.errors.push({
        email: contactData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json(results)
}

async function handleBulkAction(body: any, userId: string) {
  const data = BulkActionSchema.parse(body)

  // Verify all contacts belong to the user
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: data.contactIds },
      userId,
    },
  })

  if (contacts.length !== data.contactIds.length) {
    return NextResponse.json({ error: 'Some contacts not found' }, { status: 404 })
  }

  switch (data.action) {
    case 'add_tags':
      await prisma.contact.updateMany({
        where: { id: { in: data.contactIds } },
        data: {
          tags: {
            push: data.data?.tags || [],
          },
        },
      })
      break

    case 'remove_tags':
      // This would need custom logic to remove specific tags
      break

    case 'update_status':
      await prisma.contact.updateMany({
        where: { id: { in: data.contactIds } },
        data: {
          status: data.data?.status,
        },
      })
      break

    case 'delete':
      await prisma.contact.deleteMany({
        where: { id: { in: data.contactIds } },
      })
      break

    case 'export':
      // Return contact data for export
      return NextResponse.json({ contacts })
  }

  return NextResponse.json({ success: true, affected: contacts.length })
}

function calculateEngagementScore(emailSends: any[], interactions: any[]): number {
  let score = 0
  
  // Email engagement (40% of score)
  const totalSent = emailSends.length
  if (totalSent > 0) {
    const opened = emailSends.filter(send => send.openedAt).length
    const clicked = emailSends.filter(send => send.clickedAt).length
    
    score += (opened / totalSent) * 20 // Opens worth 20 points
    score += (clicked / totalSent) * 20 // Clicks worth 20 points
  }
  
  // Recent activity (30% of score)
  const recentInteractions = interactions.filter(
    interaction => Date.now() - new Date(interaction.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
  )
  score += Math.min(recentInteractions.length * 10, 30)
  
  // Interaction diversity (30% of score)
  const interactionTypes = new Set(interactions.map(i => i.type))
  score += interactionTypes.size * 10
  
  return Math.min(Math.round(score), 100)
}