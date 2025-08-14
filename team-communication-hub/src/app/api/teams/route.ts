import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, createTeam, getUserTeams } from '@/lib/prisma';
import { isValidSubdomain } from '@/lib/utils';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1).max(50),
  subdomain: z.string().min(3).max(20).refine(isValidSubdomain, {
    message: 'Invalid subdomain format',
  }),
  description: z.string().max(200).optional(),
});

// GET /api/teams - Get user's teams
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await getUserTeams(session.user.id);

    return NextResponse.json({
      success: true,
      data: teams.map(tm => ({
        id: tm.team.id,
        name: tm.team.name,
        subdomain: tm.team.subdomain,
        plan: tm.team.plan,
        role: tm.role,
        memberCount: tm.team._count.members,
        channelCount: tm.team._count.channels,
      })),
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Check if subdomain is already taken
    const existingTeam = await prisma.team.findUnique({
      where: { subdomain: validatedData.subdomain },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 409 }
      );
    }

    // Check user's team limit based on plan
    const userTeams = await getUserTeams(session.user.id);
    const teamLimit = 3; // Could be dynamic based on user plan

    if (userTeams.length >= teamLimit) {
      return NextResponse.json(
        { error: 'Team limit reached' },
        { status: 403 }
      );
    }

    const team = await createTeam({
      name: validatedData.name,
      subdomain: validatedData.subdomain,
      description: validatedData.description,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: team.id,
        name: team.name,
        subdomain: team.subdomain,
        description: team.description,
        plan: team.plan,
        role: 'OWNER',
        memberCount: team.members.length,
        channelCount: team.channels.length,
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

    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}