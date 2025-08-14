import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';
import type { NotificationData } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const { widgetId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const visitorId = searchParams.get('visitorId');

    // Validate widget exists
    const widget = await prisma.widget.findUnique({
      where: { id: widgetId },
      include: {
        organization: true,
        campaigns: {
          where: { isActive: true },
          include: {
            events: {
              orderBy: { createdAt: 'desc' },
              take: limit * 2, // Get more events to filter later
            },
          },
        },
      },
    });

    if (!widget || !widget.isActive) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { status: 404 }
      );
    }

    // Generate live notifications based on recent events
    const notifications = await generateLiveNotifications(widget, limit, visitorId);

    // Apply targeting rules if visitor data is available
    const filteredNotifications = await applyTargetingRules(
      notifications,
      widget,
      request,
      visitorId
    );

    return NextResponse.json({
      notifications: filteredNotifications,
      widgetSettings: widget.settings,
    });
  } catch (error) {
    console.error('Widget notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateLiveNotifications(
  widget: any,
  limit: number,
  visitorId?: string | null
): Promise<NotificationData[]> {
  const notifications: NotificationData[] = [];

  // Get recent real events
  const recentEvents = await prisma.event.findMany({
    where: {
      organizationId: widget.organizationId,
      type: {
        in: ['PURCHASE', 'SIGNUP', 'REVIEW_SUBMITTED', 'FORM_SUBMISSION'],
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Convert events to notifications
  for (const event of recentEvents) {
    const notification = await eventToNotification(event);
    if (notification) {
      notifications.push(notification);
    }
  }

  // If we don't have enough real events, generate some realistic mock notifications
  if (notifications.length < limit) {
    const mockNotifications = await generateMockNotifications(
      widget.organizationId,
      limit - notifications.length
    );
    notifications.push(...mockNotifications);
  }

  return notifications.slice(0, limit);
}

async function eventToNotification(event: any): Promise<NotificationData | null> {
  const eventData = event.data;
  const location = event.location;

  let message = '';
  let customerName = 'Someone';
  let locationText = 'Unknown location';

  // Extract customer name and location
  if (eventData.customerName) {
    customerName = eventData.customerName;
  } else if (eventData.firstName) {
    customerName = eventData.firstName;
  } else if (eventData.email) {
    customerName = eventData.email.split('@')[0];
  }

  if (location?.city && location?.country) {
    locationText = `${location.city}, ${location.country}`;
  } else if (location?.country) {
    locationText = location.country;
  }

  // Generate message based on event type
  switch (event.type) {
    case 'PURCHASE':
      const product = eventData.productName || eventData.product || 'a product';
      message = `${customerName} from ${locationText} just purchased "${product}"`;
      break;
    case 'SIGNUP':
      message = `${customerName} from ${locationText} just signed up`;
      break;
    case 'REVIEW_SUBMITTED':
      const rating = eventData.rating || 5;
      message = `${customerName} from ${locationText} left a ${rating}-star review`;
      break;
    case 'FORM_SUBMISSION':
      message = `${customerName} from ${locationText} just filled out a form`;
      break;
    default:
      return null;
  }

  return {
    id: event.id,
    type: event.type.toLowerCase(),
    message,
    customerName,
    location: locationText,
    product: eventData.productName || eventData.product,
    timestamp: event.createdAt,
    avatar: eventData.avatar || generateAvatar(customerName),
    rating: eventData.rating,
    customData: eventData,
  };
}

async function generateMockNotifications(
  organizationId: string,
  count: number
): Promise<NotificationData[]> {
  const mockData = [
    { name: 'John D.', location: 'New York, US', product: 'Pro Plan', type: 'purchase' },
    { name: 'Sarah M.', location: 'London, UK', rating: 5, type: 'review' },
    { name: 'Mike R.', location: 'Toronto, CA', type: 'signup' },
    { name: 'Lisa K.', location: 'Sydney, AU', product: 'Premium Service', type: 'purchase' },
    { name: 'David L.', location: 'Berlin, DE', rating: 4, type: 'review' },
    { name: 'Emma S.', location: 'Paris, FR', type: 'signup' },
    { name: 'Tom W.', location: 'Tokyo, JP', product: 'Enterprise Plan', type: 'purchase' },
    { name: 'Anna B.', location: 'Amsterdam, NL', rating: 5, type: 'review' },
  ];

  const notifications: NotificationData[] = [];

  for (let i = 0; i < count; i++) {
    const mock = mockData[i % mockData.length];
    const timestamp = new Date(Date.now() - Math.random() * 60 * 60 * 1000); // Random within last hour

    let message = '';
    if (mock.type === 'purchase') {
      message = `${mock.name} from ${mock.location} just purchased "${mock.product}"`;
    } else if (mock.type === 'review') {
      message = `${mock.name} from ${mock.location} left a ${mock.rating}-star review`;
    } else if (mock.type === 'signup') {
      message = `${mock.name} from ${mock.location} just signed up`;
    }

    notifications.push({
      id: `mock_${organizationId}_${i}_${timestamp.getTime()}`,
      type: mock.type as any,
      message,
      customerName: mock.name,
      location: mock.location,
      product: mock.product,
      timestamp: timestamp.toISOString(),
      avatar: generateAvatar(mock.name),
      rating: mock.rating,
      customData: { isMock: true },
    });
  }

  return notifications;
}

async function applyTargetingRules(
  notifications: NotificationData[],
  widget: any,
  request: NextRequest,
  visitorId?: string | null
): Promise<NotificationData[]> {
  // Check visitor frequency limits
  if (visitorId) {
    const visitorKey = `notification_frequency:${widget.id}:${visitorId}`;
    const shownCount = await redis.get(visitorKey);
    const maxPerSession = widget.settings?.targeting?.maxPerSession || 5;

    if (shownCount && parseInt(shownCount) >= maxPerSession) {
      return []; // Don't show more notifications
    }
  }

  // Apply other targeting rules here (page rules, device rules, etc.)
  const settings = widget.settings || {};
  const targeting = settings.targeting || {};

  // Filter by page rules if specified
  const currentPage = request.headers.get('referer');
  if (targeting.pages && targeting.pages.length > 0 && currentPage) {
    const matchesPage = targeting.pages.some((page: string) => 
      currentPage.includes(page)
    );
    if (!matchesPage) {
      return [];
    }
  }

  // Filter by device type
  const userAgent = request.headers.get('User-Agent') || '';
  const deviceType = getDeviceType(userAgent);
  if (targeting.devices && targeting.devices.length > 0) {
    if (!targeting.devices.includes(deviceType)) {
      return [];
    }
  }

  return notifications;
}

function generateAvatar(name: string): string {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=40&background=random`;
}

function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  if (/Mobile|Android|iPhone/.test(userAgent)) {
    return 'mobile';
  }
  if (/Tablet|iPad/.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}