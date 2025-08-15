import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const performanceAnalyticsSchema = z.object({
  captionIds: z.array(z.string()).optional(),
  platform: z.string().optional(),
  brandVoiceId: z.string().optional(),
  timeframe: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  organizationId: z.string().optional(),
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
    
    // Handle captionIds array parameter
    if (params.captionIds) {
      try {
        params.captionIds = JSON.parse(params.captionIds);
      } catch {
        // If not valid JSON, treat as single ID
        params.captionIds = [params.captionIds];
      }
    }

    const validatedParams = performanceAnalyticsSchema.parse(params);

    // Calculate date range
    const timeframeDays = { '7d': 7, '30d': 30, '90d': 90 };
    const days = timeframeDays[validatedParams.timeframe];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
      createdAt: { gte: startDate },
      actualEngagement: { not: null }, // Only captions with real performance data
    };

    if (validatedParams.captionIds && validatedParams.captionIds.length > 0) {
      whereClause.id = { in: validatedParams.captionIds };
    }

    if (validatedParams.platform) {
      whereClause.platform = validatedParams.platform;
    }

    if (validatedParams.brandVoiceId) {
      whereClause.brandVoiceId = validatedParams.brandVoiceId;
    }

    if (validatedParams.organizationId) {
      whereClause.organizationId = validatedParams.organizationId;
    }

    // Get captions with performance data
    const captions = await prisma.caption.findMany({
      where: whereClause,
      select: {
        id: true,
        platform: true,
        qualityScore: true,
        brandVoiceMatch: true,
        engagementPrediction: true,
        actualEngagement: true,
        createdAt: true,
        usedAt: true,
        brandVoice: {
          select: { name: true, type: true },
        },
        content: true,
        hashtags: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for performance
    });

    if (captions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalCaptions: 0,
            averageEngagement: 0,
            predictionAccuracy: 0,
            bestPerformingPlatform: null,
            bestPerformingBrandVoice: null,
          },
          captions: [],
          insights: [],
          platformComparison: [],
          brandVoiceComparison: [],
        },
      });
    }

    // Calculate performance metrics
    const performanceMetrics = captions.map(caption => {
      const actual = caption.actualEngagement as any;
      const predicted = caption.engagementPrediction || 0;

      // Calculate engagement rate based on platform
      let engagementRate = 0;
      if (actual) {
        const interactions = (actual.likes || 0) + (actual.comments || 0) + (actual.shares || 0) + (actual.saves || 0);
        const impressions = actual.impressions || 1;
        engagementRate = (interactions / impressions) * 100;
      }

      // Calculate prediction accuracy
      const predictionAccuracy = predicted > 0 
        ? Math.max(0, 100 - Math.abs(engagementRate - predicted) / predicted * 100)
        : 0;

      return {
        ...caption,
        actualEngagementRate: engagementRate,
        predictionAccuracy,
        performanceGap: engagementRate - predicted,
      };
    });

    // Calculate summary statistics
    const totalCaptions = performanceMetrics.length;
    const averageEngagement = performanceMetrics.reduce((sum, c) => sum + c.actualEngagementRate, 0) / totalCaptions;
    const averagePredictionAccuracy = performanceMetrics.reduce((sum, c) => sum + c.predictionAccuracy, 0) / totalCaptions;

    // Platform performance comparison
    const platformGroups = performanceMetrics.reduce((acc, caption) => {
      if (!acc[caption.platform]) {
        acc[caption.platform] = [];
      }
      acc[caption.platform].push(caption);
      return acc;
    }, {} as Record<string, typeof performanceMetrics>);

    const platformComparison = Object.entries(platformGroups).map(([platform, captions]) => {
      const avgEngagement = captions.reduce((sum, c) => sum + c.actualEngagementRate, 0) / captions.length;
      const avgQuality = captions.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / captions.length;
      const avgAccuracy = captions.reduce((sum, c) => sum + c.predictionAccuracy, 0) / captions.length;

      return {
        platform,
        count: captions.length,
        averageEngagement: avgEngagement,
        averageQuality: avgQuality,
        predictionAccuracy: avgAccuracy,
      };
    }).sort((a, b) => b.averageEngagement - a.averageEngagement);

    // Brand voice performance comparison
    const brandVoiceGroups = performanceMetrics
      .filter(c => c.brandVoice)
      .reduce((acc, caption) => {
        const voiceName = caption.brandVoice!.name;
        if (!acc[voiceName]) {
          acc[voiceName] = [];
        }
        acc[voiceName].push(caption);
        return acc;
      }, {} as Record<string, typeof performanceMetrics>);

    const brandVoiceComparison = Object.entries(brandVoiceGroups).map(([voiceName, captions]) => {
      const avgEngagement = captions.reduce((sum, c) => sum + c.actualEngagementRate, 0) / captions.length;
      const avgBrandMatch = captions.reduce((sum, c) => sum + (c.brandVoiceMatch || 0), 0) / captions.length;
      const avgAccuracy = captions.reduce((sum, c) => sum + c.predictionAccuracy, 0) / captions.length;

      return {
        brandVoice: voiceName,
        count: captions.length,
        averageEngagement: avgEngagement,
        averageBrandMatch: avgBrandMatch,
        predictionAccuracy: avgAccuracy,
      };
    }).sort((a, b) => b.averageEngagement - a.averageEngagement);

    // Generate insights
    const insights = generatePerformanceInsights(performanceMetrics, platformComparison, brandVoiceComparison);

    // Best performing items
    const bestPerformingPlatform = platformComparison[0]?.platform || null;
    const bestPerformingBrandVoice = brandVoiceComparison[0]?.brandVoice || null;

    const analytics = {
      summary: {
        totalCaptions,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        predictionAccuracy: Math.round(averagePredictionAccuracy * 100) / 100,
        bestPerformingPlatform,
        bestPerformingBrandVoice,
      },
      captions: performanceMetrics.slice(0, 20).map(caption => ({
        id: caption.id,
        platform: caption.platform,
        content: caption.content.slice(0, 100) + '...',
        qualityScore: caption.qualityScore,
        brandVoiceMatch: caption.brandVoiceMatch,
        predicted: caption.engagementPrediction,
        actual: caption.actualEngagementRate,
        accuracy: caption.predictionAccuracy,
        gap: caption.performanceGap,
        createdAt: caption.createdAt,
        brandVoice: caption.brandVoice?.name,
      })),
      platformComparison,
      brandVoiceComparison,
      insights,
      timeframe: validatedParams.timeframe,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    
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

function generatePerformanceInsights(
  captions: any[],
  platformComparison: any[],
  brandVoiceComparison: any[]
): string[] {
  const insights: string[] = [];

  // Platform insights
  if (platformComparison.length > 1) {
    const best = platformComparison[0];
    const worst = platformComparison[platformComparison.length - 1];
    const difference = best.averageEngagement - worst.averageEngagement;

    if (difference > 1) {
      insights.push(
        `${best.platform} performs ${difference.toFixed(1)}% better than ${worst.platform} on average`
      );
    }
  }

  // Quality vs engagement correlation
  const qualityCorrelation = calculateCorrelation(
    captions.map(c => c.qualityScore || 0),
    captions.map(c => c.actualEngagementRate)
  );

  if (qualityCorrelation > 0.5) {
    insights.push('Higher quality scores strongly correlate with better engagement');
  } else if (qualityCorrelation < -0.3) {
    insights.push('Quality scores may not be accurately predicting engagement - consider reviewing criteria');
  }

  // Brand voice insights
  if (brandVoiceComparison.length > 1) {
    const bestVoice = brandVoiceComparison[0];
    if (bestVoice.averageEngagement > 5) {
      insights.push(`"${bestVoice.brandVoice}" brand voice shows strong engagement (${bestVoice.averageEngagement.toFixed(1)}%)`);
    }
  }

  // Prediction accuracy insights
  const highAccuracyCaptions = captions.filter(c => c.predictionAccuracy > 80);
  const lowAccuracyCaptions = captions.filter(c => c.predictionAccuracy < 50);

  if (highAccuracyCaptions.length > captions.length * 0.7) {
    insights.push('AI predictions are highly accurate - you can trust the engagement forecasts');
  } else if (lowAccuracyCaptions.length > captions.length * 0.5) {
    insights.push('AI predictions need improvement - consider providing more performance feedback');
  }

  // Timing insights
  const recentCaptions = captions.filter(c => 
    new Date().getTime() - new Date(c.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  
  if (recentCaptions.length > 0) {
    const recentAvgEngagement = recentCaptions.reduce((sum, c) => sum + c.actualEngagementRate, 0) / recentCaptions.length;
    const overallAvgEngagement = captions.reduce((sum, c) => sum + c.actualEngagementRate, 0) / captions.length;
    
    if (recentAvgEngagement > overallAvgEngagement * 1.2) {
      insights.push('Recent captions are performing significantly better - keep up the momentum!');
    } else if (recentAvgEngagement < overallAvgEngagement * 0.8) {
      insights.push('Recent captions are underperforming - consider adjusting your strategy');
    }
  }

  return insights.slice(0, 5); // Limit to top 5 insights
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}