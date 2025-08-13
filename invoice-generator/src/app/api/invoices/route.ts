import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '../middleware'
import { generateInvoiceNumber, addDays, calculateSubtotal, calculateTax } from '@/lib/utils'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  clientId: z.string().cuid('Invalid client ID'),
  businessId: z.string().cuid('Invalid business ID').optional(),
  title: z.string().optional(),
  currency: z.string().default('USD'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().min(0, 'Rate must be non-negative'),
    taxRate: z.number().min(0).max(100).default(0),
  })).min(1, 'At least one item is required'),
  taxes: z.array(z.object({
    name: z.string(),
    rate: z.number().min(0).max(100),
  })).optional(),
  discounts: z.array(z.object({
    name: z.string(),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().min(0),
  })).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  footer: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)),
  templateId: z.string().cuid('Invalid template ID').optional(),
})

// GET /api/invoices - List invoices with filtering and pagination
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const search = searchParams.get('search')
    
    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { company: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: true,
          business: true,
          items: true,
          payments: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        }
      }
    })

  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
})

// POST /api/invoices - Create new invoice
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    const {
      clientId,
      businessId,
      title,
      currency,
      items,
      taxes = [],
      discounts = [],
      notes,
      terms,
      footer,
      dueDate,
      templateId,
    } = validatedData

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify business belongs to user (if provided)
    if (businessId) {
      const business = await prisma.business.findFirst({
        where: { id: businessId, userId: user.id }
      })

      if (!business) {
        return NextResponse.json(
          { success: false, error: 'Business not found' },
          { status: 404 }
        )
      }
    }

    // Calculate totals
    const subtotal = calculateSubtotal(items)
    
    let totalTaxAmount = 0
    const taxCalculations = taxes.map(tax => {
      const amount = calculateTax(subtotal, tax.rate)
      totalTaxAmount += amount
      return { ...tax, amount }
    })

    let totalDiscountAmount = 0
    const discountCalculations = discounts.map(discount => {
      const amount = discount.type === 'PERCENTAGE' 
        ? (subtotal * discount.value) / 100
        : discount.value
      totalDiscountAmount += amount
      return { ...discount, amount }
    })

    const total = subtotal + totalTaxAmount - totalDiscountAmount

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber()

    // Create invoice with all related data
    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          userId: user.id,
          businessId,
          clientId,
          invoiceNumber,
          title,
          currency,
          subtotal,
          taxAmount: totalTaxAmount,
          discountAmount: totalDiscountAmount,
          total,
          dueAmount: total,
          dueDate,
          notes,
          terms,
          footer,
          templateId,
          items: {
            create: items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate,
              taxRate: item.taxRate,
              order: index,
            })),
          },
        },
        include: {
          client: true,
          business: true,
          items: true,
          template: true,
        },
      })

      // Create tax records
      if (taxCalculations.length > 0) {
        await tx.invoiceTax.createMany({
          data: taxCalculations.map(tax => ({
            invoiceId: newInvoice.id,
            name: tax.name,
            rate: tax.rate,
            amount: tax.amount,
          })),
        })
      }

      // Create discount records
      if (discountCalculations.length > 0) {
        await tx.invoiceDiscount.createMany({
          data: discountCalculations.map(discount => ({
            invoiceId: newInvoice.id,
            name: discount.name,
            type: discount.type,
            value: discount.value,
            amount: discount.amount,
          })),
        })
      }

      return newInvoice
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_INVOICE',
        entity: 'Invoice',
        entityId: invoice.id,
        details: { invoiceNumber, total, clientId },
      }
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    })

  } catch (error) {
    console.error('Create invoice error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
})