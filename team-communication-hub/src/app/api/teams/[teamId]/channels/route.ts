import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";

// GET /api/teams/[teamId]/channels - Get team channels
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = params;

    // Verify user is a member of the team
    const teamMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    });

    if (!teamMember || teamMember.status !== "ACTIVE") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get channels the user has access to
    const channels = await db.channel.findMany({
      where: {
        teamId,
        isArchived: false,
        OR: [
          { type: "PUBLIC" },
          { type: "ANNOUNCEMENT" },
          {
            type: "PRIVATE",
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            user: {
              select: {
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    // Format channels with last message and unread count (placeholder)
    const formattedChannels = channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      isDefault: channel.isDefault,
      isArchived: channel.isArchived,
      teamId: channel.teamId,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      messageCount: channel._count.messages,
      lastMessage: channel.messages[0] || null,
      unreadCount: 0, // TODO: Implement proper unread count
    }));

    return NextResponse.json(formattedChannels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/channels - Create a new channel
const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required").max(50, "Channel name too long")
    .regex(/^[a-z0-9-_]+$/, "Channel name can only contain lowercase letters, numbers, hyphens, and underscores"),
  description: z.string().max(250, "Description too long").optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "ANNOUNCEMENT"]).default("PUBLIC"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = params;
    const body = await request.json();
    const { name, description, type } = createChannelSchema.parse(body);

    // Verify user has permission to create channels
    const teamMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    });

    if (!teamMember || teamMember.status !== "ACTIVE") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only owners and admins can create channels
    if (!["OWNER", "ADMIN"].includes(teamMember.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if channel name already exists in team
    const existingChannel = await db.channel.findFirst({
      where: {
        teamId,
        name,
      },
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: "Channel name already exists" },
        { status: 400 }
      );
    }

    // Create channel
    const channel = await db.channel.create({
      data: {
        name,
        description,
        type: type as any,
        teamId,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    const formattedChannel = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      isDefault: channel.isDefault,
      isArchived: channel.isArchived,
      teamId: channel.teamId,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      messageCount: channel._count.messages,
      lastMessage: null,
      unreadCount: 0,
    };

    return NextResponse.json(formattedChannel, { status: 201 });
  } catch (error) {
    console.error("Error creating channel:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}