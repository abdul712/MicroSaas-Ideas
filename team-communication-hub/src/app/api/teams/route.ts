import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { z } from "zod";

// GET /api/teams - Get user's teams
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await db.teamMember.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        team: {
          name: "asc",
        },
      },
    });

    const formattedTeams = teams.map((membership) => ({
      ...membership.team,
      role: membership.role,
    }));

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(30, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description too long").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = createTeamSchema.parse(body);

    // Check if slug is already taken
    const existingTeam = await db.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team slug is already taken" },
        { status: 400 }
      );
    }

    // Create team with the user as owner
    const team = await db.team.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // Create default channels
    const defaultChannels = [
      {
        name: "general",
        description: "General team discussions",
        type: "PUBLIC",
        isDefault: true,
      },
      {
        name: "random",
        description: "Random conversations and fun",
        type: "PUBLIC",
        isDefault: false,
      },
    ];

    const channels = await Promise.all(
      defaultChannels.map((channelData) =>
        db.channel.create({
          data: {
            ...channelData,
            teamId: team.id,
            members: {
              create: {
                userId: session.user.id,
                role: "ADMIN",
              },
            },
          },
        })
      )
    );

    const responseTeam = {
      ...team,
      role: team.members[0].role,
      members: undefined, // Remove members from response
    };

    return NextResponse.json(responseTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    
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