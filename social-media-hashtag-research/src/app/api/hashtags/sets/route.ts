import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSetSchema = z.object({
  name: z.string().min(1, 'Set name is required').max(100),
  description: z.string().max(500).optional(),
  hashtags: z.array(z.string()).min(1, 'At least one hashtag is required').max(50),
  isPublic: z.boolean().optional().default(false),
})

const updateSetSchema = createSetSchema.partial()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, hashtags, isPublic } = createSetSchema.parse(body)

    // Check user's plan limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        savedSets: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Define plan limits for saved sets
    const planLimits = {
      FREE: 5,
      STARTER: 20,
      PROFESSIONAL: -1, // unlimited
      BUSINESS: -1,
      AGENCY: -1,
    }

    const setLimit = planLimits[user.plan as keyof typeof planLimits]
    
    if (setLimit !== -1 && user.savedSets.length >= setLimit) {
      return NextResponse.json(
        { error: 'Saved set limit exceeded for your plan' },
        { status: 429 }
      )
    }

    // Create hashtag set
    const hashtagSet = await prisma.hashtagSet.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isPublic,
        items: {
          create: hashtags.map((tag, index) => ({
            order: index,
            hashtag: {
              connectOrCreate: {
                where: { tag },
                create: {
                  tag,
                  platform: 'INSTAGRAM', // Default platform, should be determined from context
                  postCount: BigInt(0),
                  avgEngagement: 0,
                  difficultyScore: 0,
                  trendScore: 0,
                }
              }
            }
          }))
        }
      },
      include: {
        items: {
          include: {
            hashtag: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    // Update user analytics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.userAnalytics.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        }
      },
      update: {
        setsCreated: { increment: 1 }
      },
      create: {
        userId: session.user.id,
        date: today,
        setsCreated: 1,
      }
    })

    return NextResponse.json({
      success: true,
      data: hashtagSet,
      message: 'Hashtag set created successfully'
    })

  } catch (error) {
    console.error('Create hashtag set error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includePublic = searchParams.get('includePublic') === 'true'

    const skip = (page - 1) * limit

    // Build where conditions
    const where: any = {
      OR: [
        { userId: session.user.id },
        ...(includePublic ? [{ isPublic: true }] : [])
      ]
    }

    const [sets, total] = await Promise.all([
      prisma.hashtagSet.findMany({
        where,
        include: {
          items: {
            include: {
              hashtag: true
            },
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.hashtagSet.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        sets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        }
      }
    })

  } catch (error) {
    console.error('Get hashtag sets error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}