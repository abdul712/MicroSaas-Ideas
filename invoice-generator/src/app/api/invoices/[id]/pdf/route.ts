import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '../../../middleware'
import { generateInvoicePDF } from '@/lib/pdf'

// GET /api/invoices/[id]/pdf - Generate and download invoice PDF
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/')[3] // Extract ID from path

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Find the invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id, // Ensure user owns this invoice
      },
      include: {
        client: true,
        business: true,
        items: {
          orderBy: { order: 'asc' }
        },
        payments: true,
        template: true,
        taxes: true,
        discounts: true,
        user: {
          select: {
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

    // Generate PDF
    const template = invoice.template ? {
      primaryColor: invoice.business?.primaryColor || invoice.user?.primaryColor || '#2563eb',
      secondaryColor: invoice.business?.secondaryColor || invoice.user?.secondaryColor || '#1e40af',
      accentColor: '#3b82f6',
      fontFamily: 'helvetica',
      logoUrl: invoice.business?.logo || invoice.user?.logo,
      logoPosition: 'left' as const,
      showBorder: false,
      showWatermark: false,
    } : undefined

    const pdfBuffer = await generateInvoicePDF(invoice, template)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DOWNLOAD_INVOICE_PDF',
        entity: 'Invoice',
        entityId: invoice.id,
        details: { 
          invoiceNumber: invoice.invoiceNumber,
          downloadedAt: new Date().toISOString()
        },
      }
    })

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
})