import nodemailer from 'nodemailer'
import { InvoiceWithRelations } from '@/types'
import { formatCurrency, formatDate } from './utils'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    const config: EmailConfig = {
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER || '',
        pass: process.env.EMAIL_SERVER_PASSWORD || '',
      },
    }

    this.transporter = nodemailer.createTransporter(config)
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email service verification failed:', error)
      return false
    }
  }

  async sendInvoiceEmail(
    invoice: InvoiceWithRelations,
    pdfBuffer: Buffer,
    customMessage?: string
  ): Promise<boolean> {
    try {
      const businessName = invoice.business?.name || 
                          invoice.user?.company || 
                          `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                          'Your Business'

      const subject = `Invoice ${invoice.invoiceNumber} from ${businessName}`
      
      const htmlContent = this.generateInvoiceEmailHTML(invoice, customMessage)
      const textContent = this.generateInvoiceEmailText(invoice, customMessage)

      const mailOptions = {
        from: {
          name: businessName,
          address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || '',
        },
        to: {
          name: `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim(),
          address: invoice.client.email,
        },
        subject,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Failed to send invoice email:', error)
      return false
    }
  }

  async sendPaymentConfirmation(
    invoice: InvoiceWithRelations,
    paymentAmount: number,
    paymentMethod: string
  ): Promise<boolean> {
    try {
      const businessName = invoice.business?.name || 
                          invoice.user?.company || 
                          `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                          'Your Business'

      const subject = `Payment Received - Invoice ${invoice.invoiceNumber}`
      
      const htmlContent = this.generatePaymentConfirmationHTML(invoice, paymentAmount, paymentMethod)
      const textContent = this.generatePaymentConfirmationText(invoice, paymentAmount, paymentMethod)

      const mailOptions = {
        from: {
          name: businessName,
          address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || '',
        },
        to: {
          name: `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim(),
          address: invoice.client.email,
        },
        subject,
        html: htmlContent,
        text: textContent,
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error)
      return false
    }
  }

  async sendPaymentReminder(
    invoice: InvoiceWithRelations,
    daysOverdue: number
  ): Promise<boolean> {
    try {
      const businessName = invoice.business?.name || 
                          invoice.user?.company || 
                          `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                          'Your Business'

      const subject = daysOverdue > 0 
        ? `Payment Overdue - Invoice ${invoice.invoiceNumber}` 
        : `Payment Reminder - Invoice ${invoice.invoiceNumber}`
      
      const htmlContent = this.generatePaymentReminderHTML(invoice, daysOverdue)
      const textContent = this.generatePaymentReminderText(invoice, daysOverdue)

      const mailOptions = {
        from: {
          name: businessName,
          address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || '',
        },
        to: {
          name: `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim(),
          address: invoice.client.email,
        },
        subject,
        html: htmlContent,
        text: textContent,
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Failed to send payment reminder email:', error)
      return false
    }
  }

  private generateInvoiceEmailHTML(invoice: InvoiceWithRelations, customMessage?: string): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
    const paymentUrl = `${process.env.NEXTAUTH_URL}/pay/${invoice.publicId}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .invoice-details { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .payment-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">Invoice from ${businessName}</h1>
            <p style="margin: 10px 0 0 0; color: #6c757d;">Invoice #${invoice.invoiceNumber}</p>
          </div>

          <p>Dear ${clientName},</p>

          ${customMessage ? `<p>${customMessage}</p>` : ''}

          <p>Please find attached your invoice. Here are the details:</p>

          <div class="invoice-details">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Invoice Number:</td>
                <td style="padding: 8px 0; text-align: right;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Issue Date:</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.issueDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Due Date:</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.dueDate)}</td>
              </tr>
              <tr style="border-top: 1px solid #e9ecef;">
                <td style="padding: 8px 0; font-weight: 500; font-size: 18px;">Total Amount:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 500; font-size: 18px;">${formatCurrency(Number(invoice.total), invoice.currency)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" class="payment-button">Pay Online Now</a>
          </div>

          <p>You can view and pay this invoice online by clicking the button above, or you can download the attached PDF.</p>

          ${invoice.notes ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}

          <p>Thank you for your business!</p>

          <div class="footer">
            <p><strong>${businessName}</strong></p>
            ${invoice.business?.email || invoice.user?.email ? `<p>Email: ${invoice.business?.email || invoice.user?.email}</p>` : ''}
            ${invoice.business?.phone || invoice.user?.phone ? `<p>Phone: ${invoice.business?.phone || invoice.user?.phone}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateInvoiceEmailText(invoice: InvoiceWithRelations, customMessage?: string): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
    const paymentUrl = `${process.env.NEXTAUTH_URL}/pay/${invoice.publicId}`

    return `
Invoice from ${businessName}
Invoice #${invoice.invoiceNumber}

Dear ${clientName},

${customMessage || ''}

Please find attached your invoice. Here are the details:

Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${formatDate(invoice.issueDate)}
Due Date: ${formatDate(invoice.dueDate)}
Total Amount: ${formatCurrency(Number(invoice.total), invoice.currency)}

You can pay this invoice online at: ${paymentUrl}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!

${businessName}
${invoice.business?.email || invoice.user?.email || ''}
${invoice.business?.phone || invoice.user?.phone || ''}
    `.trim()
  }

  private generatePaymentConfirmationHTML(invoice: InvoiceWithRelations, paymentAmount: number, paymentMethod: string): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0; color: #155724;">Payment Received</h1>
            <p style="margin: 10px 0 0 0; color: #155724;">Thank you for your payment!</p>
          </div>

          <p>Dear ${clientName},</p>

          <p>We have successfully received your payment for Invoice #${invoice.invoiceNumber}.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Invoice Number:</td>
                <td style="padding: 8px 0; text-align: right;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Payment Amount:</td>
                <td style="padding: 8px 0; text-align: right;">${formatCurrency(paymentAmount, invoice.currency)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Payment Method:</td>
                <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Payment Date:</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(new Date())}</td>
              </tr>
            </table>
          </div>

          <p>This payment has been applied to your account. If you have any questions, please don't hesitate to contact us.</p>

          <p>Thank you for your business!</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
            <p><strong>${businessName}</strong></p>
            ${invoice.business?.email || invoice.user?.email ? `<p>Email: ${invoice.business?.email || invoice.user?.email}</p>` : ''}
            ${invoice.business?.phone || invoice.user?.phone ? `<p>Phone: ${invoice.business?.phone || invoice.user?.phone}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generatePaymentConfirmationText(invoice: InvoiceWithRelations, paymentAmount: number, paymentMethod: string): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()

    return `
Payment Received - Thank you!

Dear ${clientName},

We have successfully received your payment for Invoice #${invoice.invoiceNumber}.

Payment Details:
Invoice Number: ${invoice.invoiceNumber}
Payment Amount: ${formatCurrency(paymentAmount, invoice.currency)}
Payment Method: ${paymentMethod}
Payment Date: ${formatDate(new Date())}

This payment has been applied to your account. If you have any questions, please don't hesitate to contact us.

Thank you for your business!

${businessName}
${invoice.business?.email || invoice.user?.email || ''}
${invoice.business?.phone || invoice.user?.phone || ''}
    `.trim()
  }

  private generatePaymentReminderHTML(invoice: InvoiceWithRelations, daysOverdue: number): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
    const paymentUrl = `${process.env.NEXTAUTH_URL}/pay/${invoice.publicId}`
    const isOverdue = daysOverdue > 0

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment ${isOverdue ? 'Overdue' : 'Reminder'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isOverdue ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .payment-button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: ${isOverdue ? '#721c24' : '#856404'};">
              Payment ${isOverdue ? 'Overdue' : 'Reminder'}
            </h1>
            <p style="margin: 10px 0 0 0;">Invoice #${invoice.invoiceNumber}</p>
          </div>

          <p>Dear ${clientName},</p>

          ${isOverdue 
            ? `<p>This is a reminder that your payment for Invoice #${invoice.invoiceNumber} is now <strong>${daysOverdue} days overdue</strong>.</p>`
            : `<p>This is a friendly reminder that payment for Invoice #${invoice.invoiceNumber} is due soon.</p>`
          }

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Invoice Number:</td>
                <td style="padding: 8px 0; text-align: right;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Due Date:</td>
                <td style="padding: 8px 0; text-align: right;">${formatDate(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 500;">Amount Due:</td>
                <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: 500;">${formatCurrency(Number(invoice.dueAmount), invoice.currency)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" class="payment-button">Pay Now</a>
          </div>

          <p>Please make your payment as soon as possible to avoid any service interruptions. You can pay online using the button above.</p>

          <p>If you have already made this payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>

          <p>Thank you for your prompt attention to this matter.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d;">
            <p><strong>${businessName}</strong></p>
            ${invoice.business?.email || invoice.user?.email ? `<p>Email: ${invoice.business?.email || invoice.user?.email}</p>` : ''}
            ${invoice.business?.phone || invoice.user?.phone ? `<p>Phone: ${invoice.business?.phone || invoice.user?.phone}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generatePaymentReminderText(invoice: InvoiceWithRelations, daysOverdue: number): string {
    const businessName = invoice.business?.name || 
                        invoice.user?.company || 
                        `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                        'Your Business'
    
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
    const paymentUrl = `${process.env.NEXTAUTH_URL}/pay/${invoice.publicId}`
    const isOverdue = daysOverdue > 0

    return `
Payment ${isOverdue ? 'Overdue' : 'Reminder'} - Invoice #${invoice.invoiceNumber}

Dear ${clientName},

${isOverdue 
  ? `This is a reminder that your payment for Invoice #${invoice.invoiceNumber} is now ${daysOverdue} days overdue.`
  : `This is a friendly reminder that payment for Invoice #${invoice.invoiceNumber} is due soon.`
}

Invoice Details:
Invoice Number: ${invoice.invoiceNumber}
Due Date: ${formatDate(invoice.dueDate)}
Amount Due: ${formatCurrency(Number(invoice.dueAmount), invoice.currency)}

Please make your payment as soon as possible. You can pay online at: ${paymentUrl}

If you have already made this payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us immediately.

Thank you for your prompt attention to this matter.

${businessName}
${invoice.business?.email || invoice.user?.email || ''}
${invoice.business?.phone || invoice.user?.phone || ''}
    `.trim()
  }
}

export const emailService = new EmailService()