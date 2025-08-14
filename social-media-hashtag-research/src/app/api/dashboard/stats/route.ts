import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const last30Days = new Date(now.setDate(now.getDate() - 30))

    // Get user analytics for the current month
    const monthlyAnalytics = await prisma.userAnalytics.findMany({
      where: {
        userId,
        date: { gte: startOfMonth }
      },
      orderBy: { date: 'desc' }
    })

    // Aggregate monthly stats
    const monthlyStats = monthlyAnalytics.reduce(
      (acc, analytics) => ({
        searches: acc.searches + analytics.searchesCount,
        setsCreated: acc.setsCreated + analytics.setsCreated,
        competitorsAdded: acc.competitorsAdded + analytics.competitorsAdded,
        apiCalls: acc.apiCalls + analytics.apiCalls,
      }),
      { searches: 0, setsCreated: 0, competitorsAdded: 0, apiCalls: 0 }
    )

    // Get total counts
    const [
      totalSavedSets,
      totalCompetitors,
      recentSearches,
      topPerformingHashtags
    ] = await Promise.all([
      // Total saved sets
      prisma.hashtagSet.count({
        where: { userId }
      }),

      // Total competitors tracked
      prisma.competitorTrack.count({
        where: { userId, isActive: true }
      }),

      // Recent searches
      prisma.hashtagSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          searchTerm: true,
          platform: true,
          createdAt: true,
        }
      }),

      // Top performing hashtags from user's sets
      prisma.hashtagSetItem.findMany({
        where: {
          set: { userId }
        },
        include: {
          hashtag: {
            select: {
              tag: true,
              platform: true,
              avgEngagement: true,
            }
          }
        },
        orderBy: {
          hashtag: {
            avgEngagement: 'desc'
          }
        },
        take: 5,
      })
    ])

    // Calculate trends - compare with previous period
    const previousMonthStart = new Date(startOfMonth)
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
    
    const previousMonthAnalytics = await prisma.userAnalytics.findMany({
      where: {
        userId,
        date: { 
          gte: previousMonthStart,
          lt: startOfMonth 
        }
      }
    })

    const previousMonthStats = previousMonthAnalytics.reduce(
      (acc, analytics) => ({
        searches: acc.searches + analytics.searchesCount,
        setsCreated: acc.setsCreated + analytics.setsCreated,
        competitorsAdded: acc.competitorsAdded + analytics.competitorsAdded,
        apiCalls: acc.apiCalls + analytics.apiCalls,
      }),
      { searches: 0, setsCreated: 0, competitorsAdded: 0, apiCalls: 0 }
    )

    // Calculate percentage changes
    const trends = {
      searches: previousMonthStats.searches ? 
        ((monthlyStats.searches - previousMonthStats.searches) / previousMonthStats.searches) * 100 : 0,
      setsCreated: previousMonthStats.setsCreated ? 
        ((monthlyStats.setsCreated - previousMonthStats.setsCreated) / previousMonthStats.setsCreated) * 100 : 0,
      competitorsAdded: previousMonthStats.competitorsAdded ? 
        ((monthlyStats.competitorsAdded - previousMonthStats.competitorsAdded) / previousMonthStats.competitorsAdded) * 100 : 0,
      apiCalls: previousMonthStats.apiCalls ? 
        ((monthlyStats.apiCalls - previousMonthStats.apiCalls) / previousMonthStats.apiCalls) * 100 : 0,
    }

    // Get activity chart data for the last 30 days
    const activityData = await prisma.userAnalytics.findMany({
      where: {
        userId,
        date: { gte: last30Days }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        searchesCount: true,
        setsCreated: true,
        apiCalls: true,
      }
    })

    const response = {
      success: true,
      data: {
        // Current period stats
        stats: {
          totalSearches: monthlyStats.searches,
          savedSets: totalSavedSets,
          competitorsTracked: totalCompetitors,
          apiCalls: monthlyStats.apiCalls,
        },
        
        // Trends compared to previous period
        trends,
        
        // Recent activity
        recentSearches: recentSearches.map(search => ({
          ...search,
          query: search.searchTerm,
        })),
        
        // Top performing hashtags
        topPerformingHashtags: topPerformingHashtags.map(item => ({
          hashtag: item.hashtag.tag,
          platform: item.hashtag.platform,
          performance: item.hashtag.avgEngagement,
        })),

        // Activity chart data
        activityChart: activityData.map(data => ({
          date: data.date.toISOString().split('T')[0],
          searches: data.searchesCount,
          sets: data.setsCreated,
          apiCalls: data.apiCalls,
        })),

        // Summary metrics
        summary: {
          totalActivity: monthlyStats.searches + monthlyStats.setsCreated + monthlyStats.apiCalls,
          avgSearchesPerDay: Math.round(monthlyStats.searches / new Date().getDate()),
          mostActiveDay: activityData.reduce((max, current) => 
            (current.searchesCount + current.setsCreated + current.apiCalls) > 
            (max.searchesCount + max.setsCreated + max.apiCalls) ? current : max, 
            activityData[0] || { date: new Date(), searchesCount: 0, setsCreated: 0, apiCalls: 0 }
          ).date,
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}