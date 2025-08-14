import { NextRequest, NextResponse } from 'next/server'
import { processIncomingEmail, ParsedEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// This webhook would receive emails from your email service provider
// (SendGrid, Mailgun, etc.) when emails are sent to your support address

const emailWebhookSchema = z.object({
  from: z.string().email(),
  fromName: z.string().optional(),
  to: z.array(z.string().email()),
  subject: z.string(),
  text: z.string(),
  html: z.string().optional(),
  messageId: z.string(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded
    contentType: z.string(),
    size: z.number(),
  })).optional(),
  timestamp: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on your email provider)
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Parse the incoming email data
    const body = await request.json()
    const emailData = emailWebhookSchema.parse(body)

    // Find the organization based on the "to" email address
    const supportEmail = emailData.to.find(email => 
      email.includes('support') || email.includes('help')
    ) || emailData.to[0]

    // For demo purposes, we'll use a default organization
    // In production, you'd map email addresses to organizations
    const organization = await prisma.organization.findFirst({
      where: {
        // You might have a mapping table or use email domain
      },
    })

    if (!organization) {
      console.error('No organization found for email:', supportEmail)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Convert webhook data to ParsedEmail format
    const parsedEmail: ParsedEmail = {
      from: emailData.from,
      fromName: emailData.fromName,
      subject: emailData.subject,
      body: emailData.text,
      htmlBody: emailData.html,
      messageId: emailData.messageId,
      inReplyTo: emailData.inReplyTo,
      references: emailData.references,
      attachments: emailData.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
        size: att.size,
      })),
      receivedAt: new Date(emailData.timestamp),
    }

    // Process the email and create/update ticket
    const ticketId = await processIncomingEmail(parsedEmail, organization.id)

    return NextResponse.json({ 
      success: true, 
      ticketId,
      message: 'Email processed successfully' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Webhook validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing email webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Email webhook endpoint active' })
}