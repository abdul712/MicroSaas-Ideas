import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clickhouse } from '@/lib/clickhouse';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey || !apiKey.startsWith('sp_')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, visitorId, pageUrl, timestamp, data } = body;

    // Validate required fields
    if (!eventType || !visitorId || !pageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { apiKey },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get visitor location (simplified - would use IP geolocation service)
    const location = await getVisitorLocation(request);

    // Store event in PostgreSQL
    const event = await prisma.event.create({
      data: {
        organizationId: organization.id,
        type: eventType.toUpperCase(),
        data: data || {},
        location,
        visitorId,
        sessionId: data?.sessionId,
        pageUrl,
        deviceType: getDeviceType(request.headers.get('User-Agent') || ''),
      },
    });

    // Store analytics data in ClickHouse
    await clickhouse.insert('widget_analytics', [
      {
        timestamp: new Date(timestamp || Date.now()).toISOString(),
        organization_id: organization.id,
        widget_id: data?.widgetId || '',
        campaign_id: data?.campaignId || '',
        event_type: eventType,
        visitor_id: visitorId,
        page_url: pageUrl,
        device_type: getDeviceType(request.headers.get('User-Agent') || ''),
        location: location?.country || '',
        conversion_value: data?.conversionValue || 0,
        attribution_data: JSON.stringify(data?.attribution || {}),
      },
    ]);

    // Update visitor session in Redis
    const sessionKey = `visitor:${visitorId}`;
    await redis.hset(sessionKey, {
      lastSeen: Date.now(),
      pageUrl,
      eventCount: await redis.hincrby(sessionKey, 'eventCount', 1),
    });
    await redis.expire(sessionKey, 3600); // 1 hour TTL

    // Handle real-time notifications based on event type
    if (eventType === 'page_view') {
      await handlePageViewEvent(organization.id, visitorId, pageUrl, location);
    } else if (eventType === 'purchase' || eventType === 'signup') {
      await handleConversionEvent(organization.id, eventType, data);
    }

    return NextResponse.json({ 
      success: true, 
      eventId: event.id 
    });

  } catch (error) {
    console.error('Widget event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getVisitorLocation(request: NextRequest) {
  // In production, use a service like MaxMind or ipapi.co
  // For now, return mock data
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            '127.0.0.1';
  
  return {
    ip,
    country: 'US',
    city: 'New York',
    region: 'NY',
  };
}

function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return 'mobile';
  }
  if (/Tablet/.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

async function handlePageViewEvent(
  organizationId: string, 
  visitorId: string, 
  pageUrl: string, 
  location: any
) {
  // Update visitor count for the page
  const pageKey = `page_visitors:${organizationId}:${encodeURIComponent(pageUrl)}`;
  await redis.sadd(pageKey, visitorId);
  await redis.expire(pageKey, 900); // 15 minutes
  
  // Update global visitor count
  const globalKey = `visitors:${organizationId}`;
  await redis.sadd(globalKey, visitorId);
  await redis.expire(globalKey, 1800); // 30 minutes
}

async function handleConversionEvent(
  organizationId: string, 
  eventType: string, 
  data: any
) {
  // This would trigger real-time notifications to connected widgets
  // Implementation would depend on WebSocket server setup
  const notificationData = {
    type: eventType,
    message: generateNotificationMessage(eventType, data),
    timestamp: new Date().toISOString(),
    organizationId,
  };
  
  // Publish to Redis for WebSocket server to pick up
  await redis.publish(`notifications:${organizationId}`, JSON.stringify(notificationData));
}

function generateNotificationMessage(eventType: string, data: any): string {
  const customerName = data.customerName || 'Someone';
  const location = data.location || 'Unknown location';
  
  switch (eventType) {
    case 'purchase':
      return `${customerName} from ${location} just purchased "${data.product}"`;
    case 'signup':
      return `${customerName} from ${location} just signed up`;
    default:
      return `${customerName} from ${location} just took an action`;
  }
}