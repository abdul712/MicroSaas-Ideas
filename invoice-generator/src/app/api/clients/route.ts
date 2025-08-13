import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '../middleware'
import { z } from 'zod'

const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  paymentTerms: z.number().min(0, 'Payment terms must be non-negative').default(30),
})

// GET /api/clients - List clients with pagination and search
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')
    const includeInvoices = searchParams.get('includeInvoices') === 'true'
    
    const where: any = {
      userId: user.id,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const include: any = {}
    if (includeInvoices) {
      include.invoices = {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }
      include.payments = {
        select: {
          id: true,
          amount: true,
          paidDate: true,
        },
        orderBy: { paidDate: 'desc' },
        take: 5,
      }
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        clients,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        }
      }
    })

  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
})

// POST /api/clients - Create new client
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Check if client with this email already exists for this user
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: user.id,
        email: validatedData.email,
        isActive: true,
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client with this email already exists' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_CLIENT',
        entity: 'Client',
        entityId: client.id,
        details: { 
          email: client.email, 
          name: `${client.firstName} ${client.lastName || ''}`.trim() 
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully'
    })

  } catch (error) {
    console.error('Create client error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
})