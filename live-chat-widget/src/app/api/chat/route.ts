import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const messageSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(1000),
  senderType: z.enum(['VISITOR', 'AGENT', 'SYSTEM', 'BOT']),
  senderId: z.string().optional(),
  visitorId: z.string().optional(),
  organizationId: z.string(),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'BOT_RESPONSE']).default('TEXT'),
  attachments: z.array(z.any()).default([]),
  metadata: z.record(z.any()).default({}),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Create or find conversation
    let conversation
    if (validatedData.conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: validatedData.conversationId },
        include: { visitor: true, assignedUser: true }
      })
    } else {
      // Create new conversation if visitor starts chat
      if (validatedData.senderType === 'VISITOR' && validatedData.visitorId) {
        conversation = await prisma.conversation.create({
          data: {
            organizationId: validatedData.organizationId,
            visitorId: validatedData.visitorId,
            status: 'WAITING',
            priority: 'NORMAL',
          },
          include: { visitor: true, assignedUser: true }
        })
      }
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or could not be created' },
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: validatedData.senderId,
        senderType: validatedData.senderType,
        content: validatedData.content,
        messageType: validatedData.messageType,
        attachments: validatedData.attachments,
        metadata: validatedData.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Update conversation status
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
        status: validatedData.senderType === 'VISITOR' && conversation.status === 'WAITING' 
          ? 'ACTIVE' 
          : conversation.status
      }
    })

    // TODO: Emit to WebSocket clients
    // This would typically use a WebSocket manager or Redis pub/sub

    return NextResponse.json({
      message,
      conversationId: conversation.id,
      success: true
    })

  } catch (error) {
    console.error('Error creating message:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const organizationId = searchParams.get('organizationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!conversationId || !organizationId) {
      return NextResponse.json(
        { error: 'conversationId and organizationId are required' },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        conversation: {
          organizationId
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip: offset,
      take: limit,
    })

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}