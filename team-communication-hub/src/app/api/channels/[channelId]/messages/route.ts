import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to channel
    const channelMember = await prisma.channelMember.findFirst({
      where: {
        channelId: params.channelId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!channelMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const messages = await prisma.message.findMany({
      where: {
        channelId: params.channelId,
        isDeleted: false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            url: true,
            thumbnailUrl: true
          }
        },
        readReceipts: {
          where: {
            userId: session.user.id
          },
          select: {
            readAt: true
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor }
      })
    })

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.readReceipts.length === 0)
      .map(msg => msg.id)

    if (unreadMessageIds.length > 0) {
      await prisma.readReceipt.createMany({
        data: unreadMessageIds.map(messageId => ({
          messageId,
          userId: session.user.id
        })),
        skipDuplicates: true
      })
    }

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      nextCursor,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}