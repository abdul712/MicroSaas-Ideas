import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { analyzeTicket } from '@/lib/openai'
import { generateTicketNumber } from '@/lib/utils'

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailMessage {
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  messageId?: string
  inReplyTo?: string
  references?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export interface ParsedEmail {
  from: string
  fromName?: string
  subject: string
  body: string
  htmlBody?: string
  messageId: string
  inReplyTo?: string
  references?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
    size: number
  }>
  receivedAt: Date
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${process.env.SUPPORT_FROM_NAME || 'Support Team'}" <${process.env.SUPPORT_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: message.to.join(', '),
      subject: message.subject,
      text: message.text,
      html: message.html,
      messageId: message.messageId,
      inReplyTo: message.inReplyTo,
      references: message.references?.join(' '),
      attachments: message.attachments,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send email')
  }
}

export async function processIncomingEmail(
  email: ParsedEmail,
  organizationId: string
): Promise<string> {
  try {
    // Check if this is a reply to an existing ticket
    const existingTicket = await findTicketByEmailThread(
      email.inReplyTo,
      email.references,
      email.from,
      organizationId
    )

    if (existingTicket) {
      // Add comment to existing ticket
      const comment = await prisma.comment.create({
        data: {
          content: email.body,
          type: 'PUBLIC',
          ticketId: existingTicket.id,
          authorId: null, // Customer comment
        },
      })

      // Create activity log
      await prisma.activity.create({
        data: {
          type: 'COMMENTED',
          description: `Customer replied via email`,
          ticketId: existingTicket.id,
          metadata: {
            messageId: email.messageId,
            from: email.from,
          },
        },
      })

      // Handle attachments
      if (email.attachments && email.attachments.length > 0) {
        await processEmailAttachments(email.attachments, existingTicket.id, comment.id)
      }

      return existingTicket.id
    } else {
      // Create new ticket
      return await createTicketFromEmail(email, organizationId)
    }
  } catch (error) {
    console.error('Error processing incoming email:', error)
    throw new Error('Failed to process incoming email')
  }
}

async function findTicketByEmailThread(
  inReplyTo?: string,
  references?: string[],
  fromEmail?: string,
  organizationId?: string
): Promise<any> {
  if (!organizationId) return null

  // Try to find ticket by message ID references
  if (inReplyTo || (references && references.length > 0)) {
    const messageIds = [inReplyTo, ...(references || [])].filter(Boolean)
    
    for (const messageId of messageIds) {
      const activity = await prisma.activity.findFirst({
        where: {
          ticket: {
            organizationId,
          },
          metadata: {
            path: ['messageId'],
            equals: messageId,
          },
        },
        include: {
          ticket: true,
        },
      })

      if (activity) {
        return activity.ticket
      }
    }
  }

  // Fallback: try to find recent ticket from same customer email
  if (fromEmail) {
    const recentTicket = await prisma.ticket.findFirst({
      where: {
        organizationId,
        customerEmail: fromEmail,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'PENDING'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return recentTicket
  }

  return null
}

async function createTicketFromEmail(
  email: ParsedEmail,
  organizationId: string
): Promise<string> {
  const ticketNumber = generateTicketNumber()

  // Analyze email content with AI
  const analysis = await analyzeTicket(email.subject, email.body, email.from)

  // Create ticket
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: email.subject,
      description: email.body,
      source: 'EMAIL',
      customerEmail: email.from,
      customerName: email.fromName || email.from,
      organizationId,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      category: analysis.category,
      urgencyScore: analysis.urgencyScore,
    },
  })

  // Add AI-suggested tags
  if (analysis.suggestedTags && analysis.suggestedTags.length > 0) {
    const tagPromises = analysis.suggestedTags.map(async (tagName) => {
      return prisma.tag.upsert({
        where: {
          name_organizationId: {
            name: tagName,
            organizationId,
          },
        },
        create: {
          name: tagName,
          organizationId,
        },
        update: {},
      })
    })

    const tags = await Promise.all(tagPromises)

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
      description: 'Ticket created from email',
      ticketId: ticket.id,
      metadata: {
        messageId: email.messageId,
        from: email.from,
        analysis,
      },
    },
  })

  // Handle attachments
  if (email.attachments && email.attachments.length > 0) {
    await processEmailAttachments(email.attachments, ticket.id)
  }

  // Send auto-reply if configured
  await sendTicketCreatedAutoReply(ticket, email)

  return ticket.id
}

async function processEmailAttachments(
  attachments: ParsedEmail['attachments'],
  ticketId: string,
  commentId?: string
): Promise<void> {
  if (!attachments) return

  for (const attachment of attachments) {
    // In a real implementation, you would upload to S3, CloudFlare R2, etc.
    // For now, we'll just store metadata
    await prisma.attachment.create({
      data: {
        filename: `${Date.now()}_${attachment.filename}`,
        originalName: attachment.filename,
        mimeType: attachment.contentType,
        size: attachment.size,
        url: `/uploads/${Date.now()}_${attachment.filename}`, // This would be the actual storage URL
        ticketId,
        commentId,
      },
    })
  }
}

async function sendTicketCreatedAutoReply(ticket: any, originalEmail: ParsedEmail): Promise<void> {
  try {
    const autoReplyTemplate = `
Dear ${ticket.customerName},

Thank you for contacting our support team. We've received your message and created ticket ${ticket.ticketNumber} for you.

Subject: ${ticket.subject}
Ticket Number: ${ticket.ticketNumber}
Priority: ${ticket.priority}

Our team will review your request and respond as soon as possible. You can reply to this email to add additional information to your ticket.

For urgent matters, please contact our emergency support line.

Best regards,
Support Team
`

    await sendEmail({
      from: process.env.SUPPORT_FROM_EMAIL || process.env.SMTP_USER || '',
      to: [ticket.customerEmail],
      subject: `[${ticket.ticketNumber}] Re: ${ticket.subject}`,
      text: autoReplyTemplate,
      inReplyTo: originalEmail.messageId,
      messageId: `${ticket.ticketNumber}-auto-reply-${Date.now()}@${process.env.SUPPORT_DOMAIN || 'support.local'}`,
    })

    // Log the auto-reply
    await prisma.activity.create({
      data: {
        type: 'COMMENTED',
        description: 'Auto-reply sent to customer',
        ticketId: ticket.id,
        metadata: {
          type: 'auto-reply',
          sentTo: ticket.customerEmail,
        },
      },
    })
  } catch (error) {
    console.error('Error sending auto-reply:', error)
    // Don't throw error for auto-reply failures
  }
}

export async function sendTicketReply(
  ticketId: string,
  message: string,
  agentId: string,
  isInternal: boolean = false
): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedAgent: {
          select: { name: true, email: true },
        },
      },
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { name: true, email: true },
    })

    if (!agent) {
      throw new Error('Agent not found')
    }

    // Create comment
    await prisma.comment.create({
      data: {
        content: message,
        type: isInternal ? 'INTERNAL' : 'PUBLIC',
        ticketId,
        authorId: agentId,
      },
    })

    // Send email to customer if not internal
    if (!isInternal) {
      const messageId = `${ticket.ticketNumber}-reply-${Date.now()}@${process.env.SUPPORT_DOMAIN || 'support.local'}`

      await sendEmail({
        from: `"${agent.name}" <${process.env.SUPPORT_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: [ticket.customerEmail],
        subject: `[${ticket.ticketNumber}] Re: ${ticket.subject}`,
        text: `${message}\n\n---\n${agent.name}\nSupport Team`,
        messageId,
      })

      // Log the reply
      await prisma.activity.create({
        data: {
          type: 'COMMENTED',
          description: `${agent.name} replied to customer`,
          ticketId,
          userId: agentId,
          metadata: {
            messageId,
            sentTo: ticket.customerEmail,
          },
        },
      })
    }
  } catch (error) {
    console.error('Error sending ticket reply:', error)
    throw new Error('Failed to send reply')
  }
}

// IMAP configuration for reading emails (would need additional setup)
export const imapConfig = {
  host: process.env.IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.IMAP_PORT || '993'),
  secure: true,
  auth: {
    user: process.env.IMAP_USER || process.env.SMTP_USER,
    pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
  },
}

export default transporter