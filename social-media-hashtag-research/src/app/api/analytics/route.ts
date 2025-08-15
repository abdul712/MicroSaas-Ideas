import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCachedData, setCachedData } from '@/lib/redis'
import { z } from 'zod'

const analyticsSchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  platform: z.enum(['INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN']).optional(),
  type: z.enum(['overview', 'hashtags', 'searches', 'sets']).default('overview'),
})

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
    const timeframe = searchParams.get('timeframe') || '30d'
    const platform = searchParams.get('platform')
    const type = searchParams.get('type') || 'overview'

    const params = analyticsSchema.parse({
      timeframe,
      platform,
      type,
    })

    // Check cache first
    const cacheKey = `analytics:${session.user.id}:${params.timeframe}:${params.platform || 'all'}:${params.type}`
    const cachedResults = await getCachedData(cacheKey)
    
    if (cachedResults) {
      return NextResponse.json(cachedResults)
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (params.timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    let analytics
    
    switch (params.type) {
      case 'overview':
        analytics = await getOverviewAnalytics(session.user.id, startDate, endDate, params.platform)
        break
      case 'hashtags':
        analytics = await getHashtagAnalytics(session.user.id, startDate, endDate, params.platform)
        break
      case 'searches':
        analytics = await getSearchAnalytics(session.user.id, startDate, endDate, params.platform)
        break
      case 'sets':
        analytics = await getSetAnalytics(session.user.id, startDate, endDate, params.platform)
        break
      default:
        analytics = await getOverviewAnalytics(session.user.id, startDate, endDate, params.platform)
    }

    const results = {
      ...analytics,
      timeframe: params.timeframe,
      platform: params.platform,
      type: params.type,
      cached: false,
      timestamp: new Date().toISOString(),
    }

    // Cache for 1 hour
    await setCachedData(cacheKey, results, 3600)

    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Analytics error:', error)
    
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

async function getOverviewAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string
) {
  const whereClause: any = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (platform) {
    whereClause.topPlatform = platform
  }

  // Get user analytics for the period
  const userAnalytics = await prisma.userAnalytics.findMany({
    where: whereClause,
    orderBy: { date: 'asc' },
  })

  // Calculate totals
  const totalSearches = userAnalytics.reduce((sum, day) => sum + day.searchesCount, 0)
  const totalSets = userAnalytics.reduce((sum, day) => sum + day.hashtagSetsCount, 0)
  const avgEngagement = userAnalytics.length > 0 
    ? userAnalytics.reduce((sum, day) => sum + (day.avgEngagement || 0), 0) / userAnalytics.length
    : 0

  // Get hashtag sets count
  const setsWhereClause: any = {
    userId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (platform) {
    setsWhereClause.platform = platform
  }

  const hashtagSetsCount = await prisma.hashtagSet.count({
    where: setsWhereClause,
  })

  // Get search trends (daily breakdown)
  const searchTrends = userAnalytics.map(day => ({
    date: day.date,
    searches: day.searchesCount,
    sets: day.hashtagSetsCount,
    engagement: day.avgEngagement || 0,
  }))

  // Get platform breakdown
  const platformBreakdown = await prisma.userSearch.groupBy({
    by: ['platform'],
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      platform: true,
    },
  })

  return {
    overview: {
      totalSearches,
      totalSets: hashtagSetsCount,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      activedays: userAnalytics.length,
    },
    trends: searchTrends,
    platformBreakdown: platformBreakdown.map(p => ({
      platform: p.platform,
      count: p._count.platform,
    })),
  }
}

async function getHashtagAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string
) {
  // Get user's hashtag sets
  const whereClause: any = {
    userId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (platform) {
    whereClause.platform = platform
  }

  const hashtagSets = await prisma.hashtagSet.findMany({
    where: whereClause,
    include: {
      hashtags: {
        include: {
          hashtag: {
            include: {
              history: {
                where: {
                  date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
                orderBy: { date: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  // Analyze hashtag performance
  const hashtagPerformance = []
  const categoryBreakdown = new Map()

  for (const set of hashtagSets) {
    for (const item of set.hashtags) {
      const hashtag = item.hashtag
      const recentHistory = hashtag.history.slice(-7) // Last 7 data points
      
      if (recentHistory.length > 0) {
        const avgEngagement = recentHistory.reduce((sum, h) => sum + h.engagementRate, 0) / recentHistory.length
        const totalReach = recentHistory.reduce((sum, h) => sum + Number(h.reach), 0)
        
        hashtagPerformance.push({
          tag: hashtag.tag,
          platform: hashtag.platform,
          category: hashtag.category,
          avgEngagement,
          totalReach,
          difficultyScore: hashtag.difficultyScore,
          trendScore: hashtag.trendScore,
          usageInSets: 1, // Count how many sets this hashtag appears in
        })

        // Category breakdown
        const category = hashtag.category || 'uncategorized'
        categoryBreakdown.set(category, (categoryBreakdown.get(category) || 0) + 1)
      }
    }
  }

  // Sort by performance
  hashtagPerformance.sort((a, b) => b.avgEngagement - a.avgEngagement)

  return {
    topPerformingHashtags: hashtagPerformance.slice(0, 10),
    categoryBreakdown: Array.from(categoryBreakdown.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    totalUniqueHashtags: hashtagPerformance.length,
  }
}

async function getSearchAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string
) {
  const whereClause: any = {
    userId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (platform) {
    whereClause.platform = platform
  }

  const searches = await prisma.userSearch.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  })

  // Analyze search patterns
  const searchTerms = new Map()
  const dailySearches = new Map()
  const platformUsage = new Map()

  for (const search of searches) {
    // Search terms frequency
    const term = search.searchTerm.toLowerCase()
    searchTerms.set(term, (searchTerms.get(term) || 0) + 1)

    // Daily search count
    const date = search.createdAt.toISOString().split('T')[0]
    dailySearches.set(date, (dailySearches.get(date) || 0) + 1)

    // Platform usage
    platformUsage.set(search.platform, (platformUsage.get(search.platform) || 0) + 1)
  }

  // Top search terms
  const topSearchTerms = Array.from(searchTerms.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }))

  // Daily search trend
  const searchTrend = Array.from(dailySearches.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return {
    totalSearches: searches.length,
    topSearchTerms,
    searchTrend,
    platformUsage: Array.from(platformUsage.entries()).map(([platform, count]) => ({
      platform,
      count,
    })),
    avgResultsPerSearch: searches.length > 0 
      ? searches.reduce((sum, s) => sum + s.resultCount, 0) / searches.length
      : 0,
  }
}

async function getSetAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string
) {
  const whereClause: any = {
    userId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (platform) {
    whereClause.platform = platform
  }

  const sets = await prisma.hashtagSet.findMany({
    where: whereClause,
    include: {
      hashtags: {
        include: {
          hashtag: true,
        },
      },
    },
    orderBy: { usageCount: 'desc' },
  })

  // Analyze set performance
  const setPerformance = sets.map(set => {
    const avgDifficulty = set.hashtags.length > 0
      ? set.hashtags.reduce((sum, h) => sum + h.hashtag.difficultyScore, 0) / set.hashtags.length
      : 0

    const avgTrendScore = set.hashtags.length > 0
      ? set.hashtags.reduce((sum, h) => sum + h.hashtag.trendScore, 0) / set.hashtags.length
      : 0

    return {
      id: set.id,
      name: set.name,
      platform: set.platform,
      hashtagCount: set.hashtags.length,
      usageCount: set.usageCount,
      avgDifficulty,
      avgTrendScore,
      isPublic: set.isPublic,
      createdAt: set.createdAt,
    }
  })

  // Platform breakdown
  const platformBreakdown = new Map()
  sets.forEach(set => {
    platformBreakdown.set(set.platform, (platformBreakdown.get(set.platform) || 0) + 1)
  })

  return {
    totalSets: sets.length,
    setPerformance: setPerformance.slice(0, 10),
    platformBreakdown: Array.from(platformBreakdown.entries()).map(([platform, count]) => ({
      platform,
      count,
    })),
    avgHashtagsPerSet: sets.length > 0
      ? sets.reduce((sum, s) => sum + s.hashtags.length, 0) / sets.length
      : 0,
    totalUsage: sets.reduce((sum, s) => sum + s.usageCount, 0),
  }
}