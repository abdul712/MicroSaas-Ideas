import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getCachedData, setCachedData } from '@/lib/redis'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1).max(100),
  platform: z.enum(['INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN']),
  limit: z.number().min(1).max(50).default(20),
  sortBy: z.enum(['trending', 'engagement', 'difficulty', 'posts']).default('trending'),
  category: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check authentication for authenticated features
    let userId: string | null = null
    if (session?.user?.id) {
      userId = session.user.id
      
      // Check rate limit for authenticated users
      const rateLimitResult = await checkRateLimit(
        `search:${userId}`,
        50, // 50 requests per hour
        3600
      )
      
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
    } else {
      // Check rate limit for anonymous users (by IP)
      const ip = request.headers.get('x-forwarded-for') || 'anonymous'
      const rateLimitResult = await checkRateLimit(
        `search:ip:${ip}`,
        10, // 10 requests per hour for anonymous
        3600
      )
      
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please sign in for higher limits.' },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const { query, platform, limit, sortBy, category } = searchSchema.parse(body)

    // Check cache first
    const cacheKey = `search:${query}:${platform}:${sortBy}:${category || 'all'}:${limit}`
    const cachedResults = await getCachedData(cacheKey)
    
    if (cachedResults) {
      // Log search for authenticated users
      if (userId) {
        await logUserSearch(userId, query, platform, cachedResults, 'cache')
      }
      
      return NextResponse.json(cachedResults)
    }

    // Perform hashtag search
    const hashtags = await searchHashtags(query, platform, limit, sortBy, category)
    
    // Generate AI recommendations
    const recommendations = await generateRecommendations(query, platform, hashtags)
    
    const results = {
      hashtags,
      recommendations,
      query,
      platform,
      total: hashtags.length,
      cached: false,
      timestamp: new Date().toISOString(),
    }

    // Cache results for 1 hour
    await setCachedData(cacheKey, results, 3600)
    
    // Log search for authenticated users
    if (userId) {
      await logUserSearch(userId, query, platform, results, 'fresh')
    }

    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Search error:', error)
    
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

async function searchHashtags(
  query: string,
  platform: string,
  limit: number,
  sortBy: string,
  category?: string
) {
  const whereClause: any = {
    platform: platform as any,
    isActive: true,
    OR: [
      { tag: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (category) {
    whereClause.category = { contains: category, mode: 'insensitive' }
  }

  let orderBy: any = { trendScore: 'desc' }
  
  switch (sortBy) {
    case 'engagement':
      orderBy = { avgEngagement: 'desc' }
      break
    case 'difficulty':
      orderBy = { difficultyScore: 'asc' }
      break
    case 'posts':
      orderBy = { postCount: 'desc' }
      break
  }

  const hashtags = await prisma.hashtag.findMany({
    where: whereClause,
    orderBy,
    take: limit,
    include: {
      history: {
        orderBy: { date: 'desc' },
        take: 7, // Last 7 days
      },
    },
  })

  return hashtags.map(hashtag => ({
    id: hashtag.id,
    tag: hashtag.tag,
    platform: hashtag.platform,
    postCount: Number(hashtag.postCount),
    avgEngagement: hashtag.avgEngagement,
    difficultyScore: hashtag.difficultyScore,
    trendScore: hashtag.trendScore,
    category: hashtag.category,
    history: hashtag.history.map(h => ({
      date: h.date,
      postCount: Number(h.postCount),
      engagementRate: h.engagementRate,
      reach: Number(h.reach),
      impressions: Number(h.impressions),
    })),
    lastUpdated: hashtag.lastUpdated,
  }))
}

async function generateRecommendations(
  query: string,
  platform: string,
  hashtags: any[]
) {
  // Simple rule-based recommendations
  // In production, this would use ML/AI models
  
  const recommendations = []
  
  // Find complementary hashtags
  const relatedTerms = generateRelatedTerms(query)
  
  for (const term of relatedTerms.slice(0, 5)) {
    const related = await prisma.hashtag.findFirst({
      where: {
        platform: platform as any,
        tag: { contains: term, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { trendScore: 'desc' },
    })
    
    if (related && !hashtags.find(h => h.id === related.id)) {
      recommendations.push({
        id: related.id,
        tag: related.tag,
        reason: `Related to "${query}"`,
        confidence: 0.8,
        type: 'related',
      })
    }
  }
  
  return recommendations
}

function generateRelatedTerms(query: string): string[] {
  // Simple related terms generation
  // In production, this would use NLP/semantic analysis
  
  const related = []
  const words = query.toLowerCase().split(' ')
  
  // Add common suffixes/prefixes
  for (const word of words) {
    related.push(`${word}s`)
    related.push(`${word}ing`)
    related.push(`${word}ed`)
    related.push(`daily${word}`)
    related.push(`${word}life`)
    related.push(`${word}love`)
  }
  
  return related.slice(0, 10)
}

async function logUserSearch(
  userId: string,
  searchTerm: string,
  platform: string,
  results: any,
  source: 'cache' | 'fresh'
) {
  try {
    await prisma.userSearch.create({
      data: {
        userId,
        searchTerm,
        platform: platform as any,
        results: results as any,
        resultCount: results.hashtags?.length || 0,
      },
    })
    
    // Update user analytics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.userAnalytics.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        searchesCount: { increment: 1 },
        topPlatform: platform as any,
      },
      create: {
        userId,
        date: today,
        searchesCount: 1,
        topPlatform: platform as any,
      },
    })
  } catch (error) {
    console.error('Error logging user search:', error)
  }
}