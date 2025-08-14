import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Platform, SearchType } from '@prisma/client'
import { HashtagSearchResult, SearchFilters } from '@/types'
import { 
  normalizeHashtag, 
  calculateDifficultyScore, 
  calculateTrendScore 
} from '@/lib/utils'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  platform: z.nativeEnum(Platform),
  type: z.nativeEnum(SearchType).optional().default('KEYWORD'),
  limit: z.number().min(1).max(100).optional().default(30),
  filters: z.object({
    minPostCount: z.number().optional(),
    maxPostCount: z.number().optional(),
    minEngagement: z.number().optional(),
    maxEngagement: z.number().optional(),
    difficulty: z.enum(['low', 'medium', 'high']).optional(),
    trending: z.boolean().optional(),
    timeframe: z.enum(['24h', '7d', '30d', '90d']).optional().default('30d'),
  }).optional(),
})

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
    const { query, platform, type, limit, filters } = searchSchema.parse(body)

    // Check user's plan limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate current month's searches
    const currentMonthSearches = user.analytics.reduce(
      (sum, analytics) => sum + analytics.searchesCount, 
      0
    )

    // Define plan limits
    const planLimits = {
      FREE: 30,
      STARTER: 100,
      PROFESSIONAL: -1, // unlimited
      BUSINESS: -1,
      AGENCY: -1,
    }

    const monthlyLimit = planLimits[user.plan as keyof typeof planLimits]
    
    if (monthlyLimit !== -1 && currentMonthSearches >= monthlyLimit) {
      return NextResponse.json(
        { error: 'Monthly search limit exceeded' },
        { status: 429 }
      )
    }

    // Build search conditions
    const whereConditions: any = {
      platform,
    }

    // Add text search
    if (query) {
      whereConditions.tag = {
        contains: normalizeHashtag(query),
        mode: 'insensitive',
      }
    }

    // Apply filters
    if (filters) {
      if (filters.minPostCount !== undefined) {
        whereConditions.postCount = { 
          ...whereConditions.postCount, 
          gte: BigInt(filters.minPostCount) 
        }
      }
      
      if (filters.maxPostCount !== undefined) {
        whereConditions.postCount = { 
          ...whereConditions.postCount, 
          lte: BigInt(filters.maxPostCount) 
        }
      }

      if (filters.minEngagement !== undefined) {
        whereConditions.avgEngagement = { 
          ...whereConditions.avgEngagement, 
          gte: filters.minEngagement 
        }
      }
      
      if (filters.maxEngagement !== undefined) {
        whereConditions.avgEngagement = { 
          ...whereConditions.avgEngagement, 
          lte: filters.maxEngagement 
        }
      }

      if (filters.difficulty) {
        const difficultyRanges = {
          low: { gte: 0, lte: 30 },
          medium: { gte: 30, lte: 70 },
          high: { gte: 70, lte: 100 },
        }
        whereConditions.difficultyScore = difficultyRanges[filters.difficulty]
      }

      if (filters.trending) {
        whereConditions.trendScore = { gte: 50 }
      }
    }

    // Search hashtags
    const hashtags = await prisma.hashtag.findMany({
      where: whereConditions,
      orderBy: [
        { trendScore: 'desc' },
        { avgEngagement: 'desc' },
      ],
      take: limit,
      include: {
        history: {
          take: 10,
          orderBy: { date: 'desc' }
        }
      }
    })

    // Generate related hashtags for each result
    const results: HashtagSearchResult[] = await Promise.all(
      hashtags.map(async (hashtag) => {
        // Find related hashtags
        const relatedTags = await prisma.hashtag.findMany({
          where: {
            platform,
            id: { not: hashtag.id },
            tag: {
              contains: hashtag.tag.substring(0, 3),
              mode: 'insensitive',
            }
          },
          take: 5,
          select: { tag: true }
        })

        return {
          hashtag: hashtag.tag,
          platform: hashtag.platform,
          postCount: hashtag.postCount,
          avgEngagement: hashtag.avgEngagement,
          difficultyScore: hashtag.difficultyScore,
          trendScore: hashtag.trendScore,
          relatedTags: relatedTags.map(t => t.tag),
        }
      })
    )

    // Save search to history
    await prisma.hashtagSearch.create({
      data: {
        userId: session.user.id,
        searchTerm: query,
        platform,
        searchType: type,
        results: results,
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
        searchesCount: { increment: 1 }
      },
      create: {
        userId: session.user.id,
        date: today,
        searchesCount: 1,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
        query,
        platform,
        total: results.length,
        hasMore: results.length === limit,
      }
    })

  } catch (error) {
    console.error('Hashtag search error:', error)
    
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
    const platform = searchParams.get('platform') as Platform
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!platform || !Object.values(Platform).includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required' },
        { status: 400 }
      )
    }

    // Get trending hashtags
    const trending = await prisma.hashtag.findMany({
      where: {
        platform,
        trendScore: { gte: 50 }
      },
      orderBy: { trendScore: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: trending,
    })

  } catch (error) {
    console.error('Trending hashtags error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}