import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.enum(['INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN']),
  hashtags: z.array(z.string()).min(1).max(30),
  isPublic: z.boolean().default(false),
})

// GET /api/hashtag-sets - Get user's hashtag sets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {
      userId: session.user.id,
    }

    if (platform) {
      whereClause.platform = platform
    }

    const [hashtagSets, total] = await Promise.all([
      prisma.hashtagSet.findMany({
        where: whereClause,
        include: {
          hashtags: {
            include: {
              hashtag: {
                include: {
                  history: {
                    orderBy: { date: 'desc' },
                    take: 7,
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.hashtagSet.count({ where: whereClause }),
    ])

    const formattedSets = hashtagSets.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      platform: set.platform,
      isPublic: set.isPublic,
      usageCount: set.usageCount,
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
      hashtags: set.hashtags.map(item => ({
        tag: item.hashtag.tag,
        position: item.position,
        postCount: Number(item.hashtag.postCount),
        avgEngagement: item.hashtag.avgEngagement,
        difficultyScore: item.hashtag.difficultyScore,
        trendScore: item.hashtag.trendScore,
        category: item.hashtag.category,
        recentHistory: item.hashtag.history.slice(0, 7).map(h => ({
          date: h.date,
          postCount: Number(h.postCount),
          engagementRate: h.engagementRate,
          reach: Number(h.reach),
          impressions: Number(h.impressions),
        })),
      })),
      performanceData: set.performanceData,
    }))

    return NextResponse.json({
      sets: formattedSets,
      total,
      limit,
      offset,
    })
    
  } catch (error) {
    console.error('Get hashtag sets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/hashtag-sets - Create new hashtag set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, platform, hashtags, isPublic } = createSetSchema.parse(body)

    // Check if user has reached their limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { hashtagSets: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check plan limits
    const limits = {
      FREE: 3,
      STARTER: 10,
      PROFESSIONAL: 50,
      BUSINESS: 200,
      ENTERPRISE: 1000,
    }

    const userLimit = limits[user.plan]
    if (user.hashtagSets.length >= userLimit) {
      return NextResponse.json(
        { error: `Plan limit reached. Maximum ${userLimit} hashtag sets allowed.` },
        { status: 403 }
      )
    }

    // Find or create hashtags
    const hashtagRecords = []
    for (let i = 0; i < hashtags.length; i++) {
      const tag = hashtags[i].replace('#', '').toLowerCase()
      
      let hashtagRecord = await prisma.hashtag.findFirst({
        where: {
          tag,
          platform: platform as any,
        },
      })

      if (!hashtagRecord) {
        // Create new hashtag with default values
        hashtagRecord = await prisma.hashtag.create({
          data: {
            tag,
            platform: platform as any,
            postCount: 0,
            avgEngagement: 0,
            difficultyScore: 50,
            trendScore: 0,
            category: 'uncategorized',
          },
        })
      }

      hashtagRecords.push({
        hashtagId: hashtagRecord.id,
        position: i,
      })
    }

    // Create hashtag set
    const hashtagSet = await prisma.hashtagSet.create({
      data: {
        userId: session.user.id,
        name,
        description,
        platform: platform as any,
        isPublic,
        hashtags: {
          create: hashtagRecords,
        },
      },
      include: {
        hashtags: {
          include: {
            hashtag: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    })

    const formattedSet = {
      id: hashtagSet.id,
      name: hashtagSet.name,
      description: hashtagSet.description,
      platform: hashtagSet.platform,
      isPublic: hashtagSet.isPublic,
      usageCount: hashtagSet.usageCount,
      createdAt: hashtagSet.createdAt,
      updatedAt: hashtagSet.updatedAt,
      hashtags: hashtagSet.hashtags.map(item => ({
        tag: item.hashtag.tag,
        position: item.position,
        postCount: Number(item.hashtag.postCount),
        avgEngagement: item.hashtag.avgEngagement,
        difficultyScore: item.hashtag.difficultyScore,
        trendScore: item.hashtag.trendScore,
        category: item.hashtag.category,
      })),
    }

    return NextResponse.json(formattedSet)
    
  } catch (error) {
    console.error('Create hashtag set error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}