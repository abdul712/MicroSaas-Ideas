import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invoices/public/[publicId] - Get invoice by public ID (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Public ID is required' },
        { status: 400 }
      )
    }

    // Find the invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { publicId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true,
          }
        },
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            website: true,
            logo: true,
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
        payments: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            amount: true,
            paidDate: true,
            method: true,
          }
        },
        template: true,
        taxes: true,
        discounts: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
          }
        }
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update viewedDate if this is the first time viewing
    if (!invoice.viewedDate) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { 
          viewedDate: new Date(),
          status: invoice.status === 'SENT' ? 'VIEWED' : invoice.status
        },
      })

      // Create notification for the invoice owner
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          type: 'INVOICE_VIEWED',
          title: 'Invoice Viewed',
          message: `Invoice ${invoice.invoiceNumber} has been viewed by ${invoice.client.firstName} ${invoice.client.lastName || ''}`,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            clientName: `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim(),
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })

  } catch (error) {
    console.error('Get public invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}