import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getAnalyticsSchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  organizationId: z.string().optional(),
  platform: z.string().optional(),
  brandVoiceId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getAnalyticsSchema.parse(params);

    // Calculate date range
    const timeframeDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const days = timeframeDays[validatedParams.timeframe];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause for filtering
    const whereClause: any = {
      userId: session.user.id,
      createdAt: { gte: startDate },
    };

    if (validatedParams.organizationId) {
      whereClause.organizationId = validatedParams.organizationId;
    }

    if (validatedParams.platform) {
      whereClause.platform = validatedParams.platform;
    }

    if (validatedParams.brandVoiceId) {
      whereClause.brandVoiceId = validatedParams.brandVoiceId;
    }

    // Get overview metrics
    const [
      totalCaptions,
      totalCreditsUsed,
      averageQualityScore,
      averageBrandVoiceMatch,
      platformDistribution,
      aiProviderDistribution,
      dailyActivity,
      topBrandVoices,
      qualityTrends,
    ] = await Promise.all([
      // Total captions generated
      prisma.caption.count({ where: whereClause }),

      // Total credits used (from usage records)
      prisma.usageRecord.aggregate({
        where: {
          createdAt: { gte: startDate },
          ...(validatedParams.organizationId
            ? { subscription: { organization: { id: validatedParams.organizationId } } }
            : { subscription: { userId: session.user.id } }
          ),
        },
        _sum: { creditsUsed: true },
      }),

      // Average quality scores
      prisma.caption.aggregate({
        where: whereClause,
        _avg: { qualityScore: true },
      }),

      // Average brand voice match
      prisma.caption.aggregate({
        where: whereClause,
        _avg: { brandVoiceMatch: true },
      }),

      // Platform distribution
      prisma.caption.groupBy({
        by: ['platform'],
        where: whereClause,
        _count: { platform: true },
        orderBy: { _count: { platform: 'desc' } },
      }),

      // AI provider distribution
      prisma.caption.groupBy({
        by: ['aiProvider'],
        where: whereClause,
        _count: { aiProvider: true },
        _avg: { cost: true },
        orderBy: { _count: { aiProvider: 'desc' } },
      }),

      // Daily activity
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as captions,
          AVG(quality_score) as avg_quality,
          SUM(cost) as total_cost
        FROM captions 
        WHERE user_id = ${session.user.id}
          AND created_at >= ${startDate}
          ${validatedParams.organizationId ? prisma.$queryRaw`AND organization_id = ${validatedParams.organizationId}` : prisma.$queryRaw``}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Top performing brand voices
      prisma.caption.groupBy({
        by: ['brandVoiceId'],
        where: {
          ...whereClause,
          brandVoiceId: { not: null },
        },
        _count: { brandVoiceId: true },
        _avg: { qualityScore: true, brandVoiceMatch: true },
        orderBy: { _avg: { qualityScore: 'desc' } },
        take: 5,
      }),

      // Quality trends over time
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          AVG(quality_score) as avg_quality,
          AVG(brand_voice_match) as avg_brand_match,
          COUNT(*) as caption_count
        FROM captions 
        WHERE user_id = ${session.user.id}
          AND created_at >= ${startDate}
          ${validatedParams.organizationId ? prisma.$queryRaw`AND organization_id = ${validatedParams.organizationId}` : prisma.$queryRaw``}
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `,
    ]);

    // Get brand voice names for top performing voices
    const brandVoiceIds = topBrandVoices
      .map(bv => bv.brandVoiceId)
      .filter(Boolean) as string[];

    const brandVoiceNames = await prisma.brandVoice.findMany({
      where: { id: { in: brandVoiceIds } },
      select: { id: true, name: true },
    });

    const brandVoiceMap = brandVoiceNames.reduce((acc, bv) => {
      acc[bv.id] = bv.name;
      return acc;
    }, {} as Record<string, string>);

    // Calculate cost efficiency metrics
    const costEfficiency = {
      averageCostPerCaption: totalCaptions > 0 
        ? (aiProviderDistribution.reduce((sum, provider) => sum + (provider._avg.cost || 0), 0) / aiProviderDistribution.length)
        : 0,
      totalCost: aiProviderDistribution.reduce((sum, provider) => 
        sum + ((provider._avg.cost || 0) * provider._count.aiProvider), 0
      ),
    };

    // Calculate engagement predictions
    const engagementMetrics = await prisma.caption.aggregate({
      where: {
        ...whereClause,
        engagementPrediction: { not: null },
      },
      _avg: { engagementPrediction: true },
      _count: { engagementPrediction: true },
    });

    // Get user's current subscription for context
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, credits: true, maxCredits: true },
    });

    const analytics = {
      overview: {
        totalCaptions,
        totalCreditsUsed: totalCreditsUsed._sum.creditsUsed || 0,
        averageQualityScore: averageQualityScore._avg.qualityScore || 0,
        averageBrandVoiceMatch: averageBrandVoiceMatch._avg.brandVoiceMatch || 0,
        averageEngagementPrediction: engagementMetrics._avg.engagementPrediction || 0,
        costEfficiency,
      },
      platformDistribution: platformDistribution.map(p => ({
        platform: p.platform,
        count: p._count.platform,
        percentage: totalCaptions > 0 ? (p._count.platform / totalCaptions) * 100 : 0,
      })),
      aiProviderDistribution: aiProviderDistribution.map(p => ({
        provider: p.aiProvider,
        count: p._count.aiProvider,
        averageCost: p._avg.cost || 0,
        totalCost: (p._avg.cost || 0) * p._count.aiProvider,
        percentage: totalCaptions > 0 ? (p._count.aiProvider / totalCaptions) * 100 : 0,
      })),
      dailyActivity: (dailyActivity as any[]).map(day => ({
        date: day.date,
        captions: Number(day.captions),
        avgQuality: Number(day.avg_quality) || 0,
        totalCost: Number(day.total_cost) || 0,
      })),
      topBrandVoices: topBrandVoices.map(bv => ({
        id: bv.brandVoiceId,
        name: brandVoiceMap[bv.brandVoiceId!] || 'Unknown',
        count: bv._count.brandVoiceId,
        averageQuality: bv._avg.qualityScore || 0,
        averageBrandMatch: bv._avg.brandVoiceMatch || 0,
      })),
      qualityTrends: (qualityTrends as any[]).map(trend => ({
        week: trend.week,
        avgQuality: Number(trend.avg_quality) || 0,
        avgBrandMatch: Number(trend.avg_brand_match) || 0,
        captionCount: Number(trend.caption_count),
      })),
      subscription: userSubscription,
      timeframe: validatedParams.timeframe,
      filters: {
        organizationId: validatedParams.organizationId,
        platform: validatedParams.platform,
        brandVoiceId: validatedParams.brandVoiceId,
      },
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}