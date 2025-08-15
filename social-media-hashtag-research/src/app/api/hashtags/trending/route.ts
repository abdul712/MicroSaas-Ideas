import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCachedData, setCachedData } from '@/lib/redis'
import { z } from 'zod'

const trendingSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN']).optional(),
  limit: z.number().min(1).max(100).default(20),
  region: z.string().default('global'),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const region = searchParams.get('region') || 'global'
    const category = searchParams.get('category')

    const params = trendingSchema.parse({
      platform,
      limit,
      region,
      category,
    })

    // Check cache first
    const cacheKey = `trending:${params.platform || 'all'}:${params.region}:${params.category || 'all'}:${params.limit}`
    const cachedResults = await getCachedData(cacheKey)
    
    if (cachedResults) {
      return NextResponse.json(cachedResults)
    }

    // Get trending hashtags
    const whereClause: any = {
      region: params.region,
    }

    if (params.platform) {
      whereClause.platform = params.platform
    }

    if (params.category) {
      whereClause.category = { contains: params.category, mode: 'insensitive' }
    }

    const trendingTopics = await prisma.trendingTopic.findMany({
      where: whereClause,
      orderBy: { trendStrength: 'desc' },
      take: params.limit,
    })

    // Get related hashtags for each trending topic
    const trendingHashtags = []
    
    for (const topic of trendingTopics) {
      for (const hashtag of topic.relatedHashtags) {
        const hashtagData = await prisma.hashtag.findFirst({
          where: {
            tag: hashtag,
            platform: params.platform ? (params.platform as any) : undefined,
            isActive: true,
          },
          include: {
            history: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        })

        if (hashtagData) {
          trendingHashtags.push({
            id: hashtagData.id,
            tag: hashtagData.tag,
            platform: hashtagData.platform,
            postCount: Number(hashtagData.postCount),
            avgEngagement: hashtagData.avgEngagement,
            difficultyScore: hashtagData.difficultyScore,
            trendScore: hashtagData.trendScore,
            category: hashtagData.category,
            topic: topic.topic,
            trendStrength: topic.trendStrength,
            peakTime: topic.peakTime,
            duration: topic.duration,
            recentHistory: hashtagData.history[0] ? {
              date: hashtagData.history[0].date,
              postCount: Number(hashtagData.history[0].postCount),
              engagementRate: hashtagData.history[0].engagementRate,
              reach: Number(hashtagData.history[0].reach),
              impressions: Number(hashtagData.history[0].impressions),
            } : null,
          })
        }
      }
    }

    // Remove duplicates and sort by trend strength
    const uniqueHashtags = trendingHashtags
      .filter((hashtag, index, self) => 
        index === self.findIndex(h => h.tag === hashtag.tag && h.platform === hashtag.platform)
      )
      .sort((a, b) => b.trendStrength - a.trendStrength)
      .slice(0, params.limit)

    const results = {
      hashtags: uniqueHashtags,
      topics: trendingTopics.map(topic => ({
        id: topic.id,
        topic: topic.topic,
        platform: topic.platform,
        region: topic.region,
        trendStrength: topic.trendStrength,
        category: topic.category,
        peakTime: topic.peakTime,
        duration: topic.duration,
        relatedHashtags: topic.relatedHashtags,
        detectedAt: topic.detectedAt,
      })),
      total: uniqueHashtags.length,
      region: params.region,
      platform: params.platform,
      cached: false,
      timestamp: new Date().toISOString(),
    }

    // Cache results for 30 minutes (trending data changes frequently)
    await setCachedData(cacheKey, results, 1800)

    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Trending hashtags error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint to update trending data (for internal use or cron jobs)
export async function POST(request: NextRequest) {
  try {
    // This would typically be called by a background job
    // to update trending hashtags from external APIs
    
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INTERNAL_API_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platform, trends } = body

    // Update trending topics
    for (const trend of trends) {
      await prisma.trendingTopic.upsert({
        where: {
          topic_platform_region: {
            topic: trend.topic,
            platform: platform,
            region: trend.region || 'global',
          },
        },
        update: {
          relatedHashtags: trend.hashtags,
          trendStrength: trend.strength,
          category: trend.category,
          peakTime: trend.peakTime ? new Date(trend.peakTime) : null,
          duration: trend.duration,
        },
        create: {
          topic: trend.topic,
          platform: platform,
          region: trend.region || 'global',
          relatedHashtags: trend.hashtags,
          trendStrength: trend.strength,
          category: trend.category,
          peakTime: trend.peakTime ? new Date(trend.peakTime) : null,
          duration: trend.duration,
        },
      })
    }

    // Clear related caches
    // In production, you'd want a more sophisticated cache invalidation
    const cachePatterns = [
      `trending:${platform}:*`,
      'trending:all:*'
    ]
    
    // Note: This is a simplified cache clearing
    // In production, use Redis SCAN with patterns

    return NextResponse.json({
      success: true,
      updated: trends.length,
      platform,
    })
    
  } catch (error) {
    console.error('Update trending data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}