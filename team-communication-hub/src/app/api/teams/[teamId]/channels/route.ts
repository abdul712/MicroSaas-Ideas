import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getTeamChannels } from '@/lib/prisma';
import { checkTeamPermission } from '@/lib/auth';
import { isValidChannelName } from '@/lib/utils';
import { z } from 'zod';

const createChannelSchema = z.object({
  name: z.string().min(1).max(20).refine(isValidChannelName, {
    message: 'Invalid channel name format',
  }),
  description: z.string().max(200).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT']).default('PUBLIC'),
});

// GET /api/teams/[teamId]/channels - Get team channels
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Check if user is a member of the team
    const hasAccess = await checkTeamPermission(session.user.id, teamId, 'MEMBER');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const channels = await getTeamChannels(teamId, session.user.id);

    return NextResponse.json({
      success: true,
      data: channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        topic: channel.topic,
        memberCount: channel._count.members,
        messageCount: channel._count.messages,
        lastMessage: channel.messages[0] ? {
          id: channel.messages[0].id,
          content: channel.messages[0].content,
          senderId: channel.messages[0].senderId,
          senderName: channel.messages[0].sender.displayName || channel.messages[0].sender.username,
          createdAt: channel.messages[0].createdAt,
        } : null,
        createdAt: channel.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/channels - Create new channel
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Check if user has permission to create channels (ADMIN or OWNER)
    const hasPermission = await checkTeamPermission(session.user.id, teamId, 'ADMIN');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createChannelSchema.parse(body);

    // Check if channel name already exists in team
    const existingChannel = await prisma.channel.findFirst({
      where: {
        teamId,
        name: validatedData.name,
      },
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel name already exists' },
        { status: 409 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        teamId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        createdBy: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    // For public channels, add all team members
    if (validatedData.type === 'PUBLIC') {
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
          status: 'ACTIVE',
          userId: { not: session.user.id }, // Exclude creator (already added)
        },
      });

      if (teamMembers.length > 0) {
        await prisma.channelMember.createMany({
          data: teamMembers.map(member => ({
            channelId: channel.id,
            userId: member.userId,
            role: 'MEMBER',
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        topic: channel.topic,
        memberCount: channel._count.members + (validatedData.type === 'PUBLIC' ? teamMembers?.length || 0 : 0),
        messageCount: channel._count.messages,
        lastMessage: null,
        createdAt: channel.createdAt,
      },
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

    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}