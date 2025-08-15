import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
            isActive: true
          }
        },
        isActive: true
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                status: true,
                lastSeenAt: true
              }
            }
          }
        },
        channels: {
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            channels: { where: { isArchived: false } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    // Check if slug is already taken
    const existingTeam = await prisma.team.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team slug already taken' },
        { status: 400 }
      )
    }

    // Create team with transaction
    const team = await prisma.$transaction(async (tx) => {
      // Create team
      const newTeam = await tx.team.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          ownerId: session.user.id,
          settings: {
            allowGuestAccess: false,
            messageRetentionDays: 365,
            fileUploadLimit: 25 * 1024 * 1024, // 25MB
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      })

      // Add owner as team member
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: session.user.id,
          role: 'OWNER'
        }
      })

      // Create default general channel
      const generalChannel = await tx.channel.create({
        data: {
          name: 'General',
          slug: 'general',
          description: 'General team discussions',
          type: 'PUBLIC',
          teamId: newTeam.id,
          createdById: session.user.id,
        }
      })

      // Add owner to general channel
      await tx.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId: session.user.id,
          role: 'ADMIN'
        }
      })

      // Log activity
      await tx.activity.create({
        data: {
          type: 'TEAM_SETTINGS_UPDATED',
          data: {
            action: 'team_created',
            teamId: newTeam.id
          },
          userId: session.user.id,
          teamId: newTeam.id
        }
      })

      return newTeam
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}