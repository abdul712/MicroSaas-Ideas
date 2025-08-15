import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify card ownership
    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      select: { userId: true },
    });

    if (!card || card.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    // Get analytics data
    const [
      totalViews,
      totalConnections,
      recentViews,
      topLocations,
      deviceBreakdown,
      timeSeriesData
    ] = await Promise.all([
      // Total views
      prisma.cardView.count({
        where: { cardId: params.cardId },
      }),
      
      // Total connections
      prisma.connection.count({
        where: { cardId: params.cardId },
      }),
      
      // Recent views (last 30 days)
      prisma.cardView.findMany({
        where: {
          cardId: params.cardId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
      
      // Top locations
      prisma.$queryRaw`
        SELECT 
          location->>'country' as country,
          location->>'city' as city,
          COUNT(*) as count
        FROM card_views 
        WHERE card_id = ${params.cardId} 
          AND location IS NOT NULL
        GROUP BY location->>'country', location->>'city'
        ORDER BY count DESC
        LIMIT 10
      `,
      
      // Device breakdown
      prisma.$queryRaw`
        SELECT 
          device,
          COUNT(*) as count
        FROM card_views 
        WHERE card_id = ${params.cardId}
          AND device IS NOT NULL
        GROUP BY device
      `,
      
      // Time series data (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as views
        FROM card_views 
        WHERE card_id = ${params.cardId}
          AND timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `,
    ]);

    // Calculate additional metrics
    const today = new Date();
    const viewsToday = recentViews.filter(view => 
      view.timestamp.toDateString() === today.toDateString()
    ).length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const viewsThisWeek = recentViews.filter(view => 
      view.timestamp >= weekAgo
    ).length;

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const viewsThisMonth = recentViews.filter(view => 
      view.timestamp >= monthAgo
    ).length;

    const analytics = {
      totalViews,
      totalConnections,
      totalShares: 0, // To be implemented
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      topLocations: topLocations as Array<{
        country: string;
        city: string;
        count: number;
      }>,
      deviceBreakdown: deviceBreakdown as Array<{
        device: string;
        count: number;
      }>,
      timeSeriesData: timeSeriesData as Array<{
        date: string;
        views: number;
      }>,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}