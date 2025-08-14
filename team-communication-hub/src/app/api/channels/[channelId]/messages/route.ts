import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChannelMessages, createMessage, updateTeamUsage } from '@/lib/prisma';
import { checkChannelAccess } from '@/lib/auth';
import { sanitizeMessage, extractMentions } from '@/lib/utils';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  threadId: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'AI_RESPONSE']).default('TEXT'),
});

// GET /api/channels/[channelId]/messages - Get channel messages
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || undefined;

    // Check if user has access to the channel
    const hasAccess = await checkChannelAccess(session.user.id, channelId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const messages = await getChannelMessages(channelId, limit, cursor);

    return NextResponse.json({
      success: true,
      data: messages.map(message => ({
        id: message.id,
        content: message.content,
        type: message.type,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        createdAt: message.createdAt,
        threadId: message.threadId,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          avatarUrl: message.sender.avatarUrl,
          status: message.sender.status,
        },
        reactions: message.reactions.map(reaction => ({
          id: reaction.id,
          emoji: reaction.emoji,
          userId: reaction.userId,
          user: {
            id: reaction.user.id,
            username: reaction.user.username,
            displayName: reaction.user.displayName,
            avatarUrl: reaction.user.avatarUrl,
          },
          createdAt: reaction.createdAt,
        })),
        attachments: message.attachments.map(attachment => ({
          id: attachment.file.id,
          filename: attachment.file.filename,
          originalName: attachment.file.originalName,
          mimeType: attachment.file.mimeType,
          size: attachment.file.size,
          url: attachment.file.url,
          thumbnailUrl: attachment.file.thumbnailUrl,
          metadata: attachment.file.metadata,
        })),
        mentions: message.mentions.map(mention => mention.userId),
      })),
      pagination: {
        hasMore: messages.length === limit,
        cursor: messages.length > 0 ? messages[messages.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/channels/[channelId]/messages - Send new message
export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;

    // Check if user has access to the channel
    const hasAccess = await checkChannelAccess(session.user.id, channelId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Get channel to verify team
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { teamId: true },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Sanitize message content
    const sanitizedContent = sanitizeMessage(validatedData.content);
    
    // Extract mentions
    const mentions = extractMentions(sanitizedContent);

    // Create the message
    const message = await createMessage({
      content: sanitizedContent,
      senderId: session.user.id,
      channelId,
      teamId: channel.teamId,
      threadId: validatedData.threadId,
      type: validatedData.type,
    });

    // Handle mentions - create mention records
    if (mentions.length > 0) {
      const mentionUsers = await prisma.user.findMany({
        where: {
          username: { in: mentions },
        },
        select: { id: true },
      });

      if (mentionUsers.length > 0) {
        await prisma.messageMention.createMany({
          data: mentionUsers.map(user => ({
            messageId: message.id,
            userId: user.id,
          })),
        });
      }
    }

    // Update team usage metrics
    await updateTeamUsage(channel.teamId, {
      messageCount: 1,
      activeUsers: 1,
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      teamId: channel.teamId,
      action: 'MESSAGE_SENT',
      resourceType: 'message',
      resourceId: message.id,
      metadata: {
        channelId,
        threadId: validatedData.threadId,
        mentions,
      },
    });

    // Return the created message
    const responseData = {
      id: message.id,
      content: message.content,
      type: message.type,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      createdAt: message.createdAt,
      threadId: message.threadId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatarUrl: message.sender.avatarUrl,
        status: message.sender.status,
      },
      reactions: message.reactions,
      attachments: message.attachments.map(attachment => ({
        id: attachment.file.id,
        filename: attachment.file.filename,
        originalName: attachment.file.originalName,
        mimeType: attachment.file.mimeType,
        size: attachment.file.size,
        url: attachment.file.url,
        thumbnailUrl: attachment.file.thumbnailUrl,
        metadata: attachment.file.metadata,
      })),
      mentions,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}