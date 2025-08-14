import jsPDF from 'jspdf'
import { formatCurrency, formatDate } from './utils'
import { InvoiceWithRelations } from '@/types'

export interface PDFTemplate {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  logoUrl?: string
  logoPosition: 'left' | 'center' | 'right'
  showBorder: boolean
  showWatermark: boolean
}

const defaultTemplate: PDFTemplate = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  fontFamily: 'helvetica',
  logoPosition: 'left',
  showBorder: false,
  showWatermark: false,
}

export class InvoicePDFGenerator {
  private doc: jsPDF
  private template: PDFTemplate
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor(template: Partial<PDFTemplate> = {}) {
    this.doc = new jsPDF()
    this.template = { ...defaultTemplate, ...template }
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
  }

  async generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
    try {
      // Set document properties
      this.doc.setProperties({
        title: `Invoice ${invoice.invoiceNumber}`,
        subject: `Invoice for ${invoice.client.firstName} ${invoice.client.lastName || ''}`,
        author: invoice.business?.name || `${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`,
        creator: 'Invoice Generator',
      })

      // Add header
      this.addHeader(invoice)

      // Add business and client info
      this.addBusinessInfo(invoice)
      this.addClientInfo(invoice)

      // Add invoice details
      this.addInvoiceDetails(invoice)

      // Add line items
      this.addLineItems(invoice)

      // Add totals
      this.addTotals(invoice)

      // Add footer
      this.addFooter(invoice)

      // Return PDF as buffer
      return Buffer.from(this.doc.output('arraybuffer'))

    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  private addHeader(invoice: InvoiceWithRelations) {
    // Set primary color
    this.doc.setTextColor(this.template.primaryColor)
    
    // Add logo if provided
    if (this.template.logoUrl) {
      // Logo would be added here if we had the image
      // For now, we'll use text-based branding
    }

    // Add company name/title
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`.trim()
    
    if (this.template.logoPosition === 'center') {
      this.doc.text(businessName, this.pageWidth / 2, 30, { align: 'center' })
    } else if (this.template.logoPosition === 'right') {
      this.doc.text(businessName, this.pageWidth - this.margin, 30, { align: 'right' })
    } else {
      this.doc.text(businessName, this.margin, 30)
    }

    // Add "INVOICE" title
    this.doc.setFontSize(18)
    this.doc.setTextColor('#000000')
    this.doc.text('INVOICE', this.pageWidth - this.margin, 30, { align: 'right' })

    // Add line separator
    this.doc.setDrawColor(this.template.primaryColor)
    this.doc.setLineWidth(1)
    this.doc.line(this.margin, 40, this.pageWidth - this.margin, 40)
  }

  private addBusinessInfo(invoice: InvoiceWithRelations) {
    let yPosition = 55
    this.doc.setFontSize(10)
    this.doc.setTextColor('#000000')
    this.doc.setFont('helvetica', 'normal')

    const business = invoice.business || invoice.user

    if (business?.email) {
      this.doc.text(`Email: ${business.email}`, this.margin, yPosition)
      yPosition += 5
    }

    if (business?.phone) {
      this.doc.text(`Phone: ${business.phone}`, this.margin, yPosition)
      yPosition += 5
    }

    if (business?.address) {
      this.doc.text(business.address, this.margin, yPosition)
      yPosition += 5

      if (business?.city || business?.state || business?.postalCode) {
        const addressLine2 = [business?.city, business?.state, business?.postalCode]
          .filter(Boolean)
          .join(', ')
        this.doc.text(addressLine2, this.margin, yPosition)
        yPosition += 5
      }
    }

    if (business?.website) {
      this.doc.setTextColor(this.template.primaryColor)
      this.doc.text(business.website, this.margin, yPosition)
      this.doc.setTextColor('#000000')
    }
  }

  private addClientInfo(invoice: InvoiceWithRelations) {
    let yPosition = 55
    const xPosition = this.pageWidth / 2 + 20

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Bill To:', xPosition, yPosition)
    yPosition += 10

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
    this.doc.text(clientName, xPosition, yPosition)
    yPosition += 5

    if (invoice.client.company) {
      this.doc.text(invoice.client.company, xPosition, yPosition)
      yPosition += 5
    }

    if (invoice.client.email) {
      this.doc.text(invoice.client.email, xPosition, yPosition)
      yPosition += 5
    }

    if (invoice.client.address) {
      this.doc.text(invoice.client.address, xPosition, yPosition)
      yPosition += 5

      if (invoice.client.city || invoice.client.state || invoice.client.postalCode) {
        const addressLine2 = [invoice.client.city, invoice.client.state, invoice.client.postalCode]
          .filter(Boolean)
          .join(', ')
        this.doc.text(addressLine2, xPosition, yPosition)
      }
    }
  }

  private addInvoiceDetails(invoice: InvoiceWithRelations) {
    const yPosition = 110
    const leftColumn = this.margin
    const rightColumn = this.pageWidth - 80

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')

    // Left column
    this.doc.text('Invoice Number:', leftColumn, yPosition)
    this.doc.text('Issue Date:', leftColumn, yPosition + 8)
    this.doc.text('Due Date:', leftColumn, yPosition + 16)

    // Right column values
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(invoice.invoiceNumber, rightColumn, yPosition, { align: 'right' })
    this.doc.text(formatDate(invoice.issueDate), rightColumn, yPosition + 8, { align: 'right' })
    this.doc.text(formatDate(invoice.dueDate), rightColumn, yPosition + 16, { align: 'right' })

    // Status badge
    if (invoice.status === 'PAID') {
      this.doc.setFillColor('#10b981')
    } else if (invoice.status === 'OVERDUE') {
      this.doc.setFillColor('#ef4444')
    } else {
      this.doc.setFillColor('#f59e0b')
    }

    this.doc.rect(rightColumn - 40, yPosition - 5, 35, 8, 'F')
    this.doc.setTextColor('#ffffff')
    this.doc.setFontSize(8)
    this.doc.text(invoice.status, rightColumn - 22, yPosition, { align: 'center' })
    this.doc.setTextColor('#000000')
  }

  private addLineItems(invoice: InvoiceWithRelations) {
    const startY = 140
    let yPosition = startY

    // Table headers
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, yPosition - 5, this.pageWidth - 2 * this.margin, 12, 'F')

    this.doc.text('Description', this.margin + 2, yPosition + 2)
    this.doc.text('Qty', this.pageWidth - 120, yPosition + 2, { align: 'right' })
    this.doc.text('Rate', this.pageWidth - 80, yPosition + 2, { align: 'right' })
    this.doc.text('Amount', this.pageWidth - this.margin - 2, yPosition + 2, { align: 'right' })

    yPosition += 15

    // Table rows
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9)

    invoice.items.forEach((item) => {
      // Check if we need a new page
      if (yPosition > this.pageHeight - 60) {
        this.doc.addPage()
        yPosition = 30
      }

      this.doc.text(item.description, this.margin + 2, yPosition)
      this.doc.text(item.quantity.toString(), this.pageWidth - 120, yPosition, { align: 'right' })
      this.doc.text(formatCurrency(Number(item.rate), invoice.currency), this.pageWidth - 80, yPosition, { align: 'right' })
      this.doc.text(formatCurrency(Number(item.amount), invoice.currency), this.pageWidth - this.margin - 2, yPosition, { align: 'right' })

      yPosition += 8
    })

    // Draw table border
    this.doc.setDrawColor('#e5e7eb')
    this.doc.rect(this.margin, startY - 5, this.pageWidth - 2 * this.margin, yPosition - startY + 5)
  }

  private addTotals(invoice: InvoiceWithRelations) {
    let yPosition = Math.max(190, 140 + 20 + (invoice.items.length * 8) + 20)
    const rightAlign = this.pageWidth - this.margin - 2
    const labelX = this.pageWidth - 80

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    // Subtotal
    this.doc.text('Subtotal:', labelX, yPosition, { align: 'right' })
    this.doc.text(formatCurrency(Number(invoice.subtotal), invoice.currency), rightAlign, yPosition, { align: 'right' })
    yPosition += 8

    // Tax
    if (Number(invoice.taxAmount) > 0) {
      this.doc.text('Tax:', labelX, yPosition, { align: 'right' })
      this.doc.text(formatCurrency(Number(invoice.taxAmount), invoice.currency), rightAlign, yPosition, { align: 'right' })
      yPosition += 8
    }

    // Discount
    if (Number(invoice.discountAmount) > 0) {
      this.doc.text('Discount:', labelX, yPosition, { align: 'right' })
      this.doc.text(`-${formatCurrency(Number(invoice.discountAmount), invoice.currency)}`, rightAlign, yPosition, { align: 'right' })
      yPosition += 8
    }

    // Total
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(12)
    this.doc.setDrawColor(this.template.primaryColor)
    this.doc.line(labelX - 20, yPosition, rightAlign + 5, yPosition)
    yPosition += 8

    this.doc.text('Total:', labelX, yPosition, { align: 'right' })
    this.doc.text(formatCurrency(Number(invoice.total), invoice.currency), rightAlign, yPosition, { align: 'right' })

    // Amount due (if different from total)
    if (Number(invoice.dueAmount) !== Number(invoice.total)) {
      yPosition += 10
      this.doc.setTextColor(this.template.primaryColor)
      this.doc.text('Amount Due:', labelX, yPosition, { align: 'right' })
      this.doc.text(formatCurrency(Number(invoice.dueAmount), invoice.currency), rightAlign, yPosition, { align: 'right' })
      this.doc.setTextColor('#000000')
    }
  }

  private addFooter(invoice: InvoiceWithRelations) {
    const footerY = this.pageHeight - 40

    // Notes
    if (invoice.notes) {
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Notes:', this.margin, footerY - 20)
      
      this.doc.setFont('helvetica', 'normal')
      const splitNotes = this.doc.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin)
      this.doc.text(splitNotes, this.margin, footerY - 12)
    }

    // Terms
    if (invoice.terms) {
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Terms & Conditions:', this.margin, footerY - 5)
      
      this.doc.setFont('helvetica', 'normal')
      const splitTerms = this.doc.splitTextToSize(invoice.terms, this.pageWidth - 2 * this.margin)
      this.doc.text(splitTerms, this.margin, footerY + 3)
    }

    // Footer text
    if (invoice.footer) {
      this.doc.setFontSize(8)
      this.doc.setTextColor('#666666')
      this.doc.text(invoice.footer, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' })
    }
  }
}

export async function generateInvoicePDF(
  invoice: InvoiceWithRelations,
  template?: Partial<PDFTemplate>
): Promise<Buffer> {
  const generator = new InvoicePDFGenerator(template)
  return await generator.generateInvoicePDF(invoice)
}