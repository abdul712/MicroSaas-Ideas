import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is member of team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const channels = await prisma.channel.findMany({
      where: {
        teamId: params.teamId,
        isArchived: false,
        OR: [
          { type: 'PUBLIC' },
          {
            type: 'PRIVATE',
            members: {
              some: {
                userId: session.user.id,
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        createdBy: {
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
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            messages: { where: { isDeleted: false } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin or owner of team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: session.user.id,
        isActive: true,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createChannelSchema.parse(body)

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists in team
    const existingChannel = await prisma.channel.findFirst({
      where: {
        teamId: params.teamId,
        slug: slug
      }
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel name already exists' },
        { status: 400 }
      )
    }

    // Create channel with transaction
    const channel = await prisma.$transaction(async (tx) => {
      const newChannel = await tx.channel.create({
        data: {
          name: validatedData.name,
          slug: slug,
          description: validatedData.description,
          type: validatedData.type,
          teamId: params.teamId,
          createdById: session.user.id,
        },
        include: {
          createdBy: {
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

      // Add creator to channel
      await tx.channelMember.create({
        data: {
          channelId: newChannel.id,
          userId: session.user.id,
          role: 'ADMIN'
        }
      })

      // If public channel, add all team members
      if (validatedData.type === 'PUBLIC') {
        const teamMembers = await tx.teamMember.findMany({
          where: {
            teamId: params.teamId,
            isActive: true,
            userId: { not: session.user.id } // Exclude creator (already added)
          }
        })

        if (teamMembers.length > 0) {
          await tx.channelMember.createMany({
            data: teamMembers.map(member => ({
              channelId: newChannel.id,
              userId: member.userId,
              role: 'MEMBER' as const
            }))
          })
        }
      }

      // Log activity
      await tx.activity.create({
        data: {
          type: 'CHANNEL_CREATED',
          data: {
            channelId: newChannel.id,
            channelName: newChannel.name,
            channelType: newChannel.type
          },
          userId: session.user.id,
          teamId: params.teamId
        }
      })

      return newChannel
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}