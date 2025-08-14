import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { contentIdeaGenerator } from '@/services/openai'
import { trendAnalysisService } from '@/services/trends'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      niche,
      keywords,
      contentType,
      toneOfVoice,
      targetAudience,
      competitors,
      count = 1
    } = body

    // Validate required fields
    if (!niche || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Niche and keywords are required' },
        { status: 400 }
      )
    }

    // Check user's credit limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, apiUsage: true, apiLimit: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get trend data for keywords
    const trendData = await trendAnalysisService.analyzeKeywordTrends(keywords.slice(0, 3))

    // Generate content ideas using AI
    const generatedIdeas = await contentIdeaGenerator.generateIdeas({
      niche,
      keywords,
      contentType: contentType || 'blog_post',
      toneOfVoice,
      targetAudience,
      competitors,
      trendData,
      count: Math.min(count, 5) // Limit to 5 ideas per request
    })

    // Save ideas to database
    const savedIdeas = await Promise.all(
      generatedIdeas.map(async (idea) => {
        // Find or create niche
        let userNiche = await prisma.userNiche.findFirst({
          where: {
            userId: session.user.id,
            nicheName: niche
          }
        })

        if (!userNiche) {
          userNiche = await prisma.userNiche.create({
            data: {
              userId: session.user.id,
              nicheName: niche,
              keywords,
              competitors: competitors || [],
              isPrimary: false
            }
          })
        }

        // Create content idea
        const contentIdea = await prisma.contentIdea.create({
          data: {
            userId: session.user.id,
            nicheId: userNiche.id,
            title: idea.title,
            description: idea.description,
            outline: idea.outline.join('\n'),
            keywords: idea.keywords,
            primaryKeyword: idea.primaryKeyword,
            contentType: contentType || 'blog_post',
            difficultyScore: idea.difficultyScore,
            seoScore: idea.seoScore,
            estimatedReadTime: idea.estimatedReadTime,
            targetWordCount: idea.targetWordCount,
            angle: idea.angle,
            hookSuggestions: idea.hookSuggestions,
            ctaSuggestions: idea.ctaSuggestions,
          }
        })

        // Save trend data
        for (const trend of trendData) {
          await prisma.trendData.upsert({
            where: { keyword: trend.keyword },
            update: {
              searchVolume: trend.searchVolume,
              trendDirection: trend.trendDirection,
              relatedQueries: trend.relatedQueries,
              competition: trend.competition,
              contentIdeaId: contentIdea.id,
            },
            create: {
              keyword: trend.keyword,
              searchVolume: trend.searchVolume,
              trendDirection: trend.trendDirection,
              relatedQueries: trend.relatedQueries,
              competition: trend.competition,
              contentIdeaId: contentIdea.id,
            }
          })
        }

        return {
          ...contentIdea,
          trendData: trendData.filter(t => idea.keywords.includes(t.keyword))
        }
      })
    )

    // Update user credits and usage
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: user.credits - 1,
        apiUsage: user.apiUsage + 1
      }
    })

    // Log API usage
    await prisma.aPIUsageLog.create({
      data: {
        userId: session.user.id,
        endpoint: '/api/generate-ideas',
        method: 'POST',
        statusCode: 200,
        responseTime: Date.now(),
        metadata: {
          niche,
          keywords,
          contentType,
          ideasGenerated: generatedIdeas.length
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
        ideasGenerated: {
          increment: generatedIdeas.length
        },
        apiCallsMade: {
          increment: 1
        }
      },
      create: {
        userId: session.user.id,
        date: today,
        ideasGenerated: generatedIdeas.length,
        apiCallsMade: 1
      }
    })

    return NextResponse.json({
      ideas: savedIdeas,
      creditsRemaining: user.credits - 1,
      trendData
    })

  } catch (error) {
    console.error('Error generating ideas:', error)
    return NextResponse.json(
      { error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    )
  }
}