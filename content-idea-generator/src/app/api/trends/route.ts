import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { trendAnalysisService } from '@/services/trends'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'daily'
    const geo = searchParams.get('geo') || 'US'
    const keywords = searchParams.get('keywords')?.split(',') || []

    let trendsData

    switch (type) {
      case 'daily':
        trendsData = await trendAnalysisService.getDailyTrends(geo)
        break
      
      case 'keywords':
        if (keywords.length === 0) {
          return NextResponse.json(
            { error: 'Keywords required for keyword trends' },
            { status: 400 }
          )
        }
        trendsData = await trendAnalysisService.analyzeKeywordTrends(keywords, geo)
        break
      
      case 'related':
        const keyword = searchParams.get('keyword')
        if (!keyword) {
          return NextResponse.json(
            { error: 'Keyword required for related trends' },
            { status: 400 }
          )
        }
        const relatedQueries = await trendAnalysisService.getRelatedQueries(keyword, geo)
        const relatedTopics = await trendAnalysisService.getRelatedTopics(keyword, geo)
        trendsData = { relatedQueries, relatedTopics }
        break
      
      case 'seasonal':
        const seasonalKeyword = searchParams.get('keyword')
        if (!seasonalKeyword) {
          return NextResponse.json(
            { error: 'Keyword required for seasonal trends' },
            { status: 400 }
          )
        }
        trendsData = await trendAnalysisService.getSeasonalTrends(seasonalKeyword, geo)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid trend type' },
          { status: 400 }
        )
    }

    // Log API usage
    await prisma.aPIUsageLog.create({
      data: {
        userId: session.user.id,
        endpoint: '/api/trends',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now(),
        metadata: {
          type,
          geo,
          keywords
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
          date: today
        }
      },
      update: {
        trendsAnalyzed: {
          increment: 1
        },
        apiCallsMade: {
          increment: 1
        }
      },
      create: {
        userId: session.user.id,
        date: today,
        trendsAnalyzed: 1,
        apiCallsMade: 1
      }
    })

    return NextResponse.json({
      type,
      geo,
      data: trendsData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trends. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { keywords, geo = 'US' } = body

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    // Analyze trends for multiple keywords
    const trendsData = await trendAnalysisService.analyzeKeywordTrends(keywords, geo)
    
    // Store trend data in database
    for (const trend of trendsData) {
      await prisma.trendData.upsert({
        where: { keyword: trend.keyword },
        update: {
          searchVolume: trend.searchVolume,
          trendDirection: trend.trendDirection,
          relatedQueries: trend.relatedQueries,
          competition: trend.competition,
          geographicData: trend.geographicData,
        },
        create: {
          keyword: trend.keyword,
          searchVolume: trend.searchVolume,
          trendDirection: trend.trendDirection,
          relatedQueries: trend.relatedQueries,
          competition: trend.competition,
          geographicData: trend.geographicData,
        }
      })
    }

    // Log API usage
    await prisma.aPIUsageLog.create({
      data: {
        userId: session.user.id,
        endpoint: '/api/trends',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now(),
        metadata: {
          keywords,
          geo,
          trendsAnalyzed: trendsData.length
        }
      }
    })

    return NextResponse.json({
      trends: trendsData,
      totalAnalyzed: trendsData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error analyzing trends:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trends. Please try again.' },
      { status: 500 }
    )
  }
}