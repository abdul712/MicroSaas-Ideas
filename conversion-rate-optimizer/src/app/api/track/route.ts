import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { behaviorTracker } from '@/lib/analytics/behavior-tracker';
import { abTestingEngine } from '@/lib/analytics/ab-testing-engine';
import { z } from 'zod';

const trackingEventSchema = z.object({
  type: z.string(),
  properties: z.record(z.any()).optional(),
  sessionId: z.string(),
  userId: z.string().optional(),
  projectId: z.string(),
  url: z.string(),
  timestamp: z.number()
});

const batchTrackingSchema = z.object({
  projectId: z.string(),
  events: z.array(trackingEventSchema)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = batchTrackingSchema.parse(body);
    const { projectId, events } = validatedData;

    // Verify project exists and get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Process each event
    const processedEvents = [];
    
    for (const event of events) {
      try {
        // Track the event using our behavior tracker
        await behaviorTracker.trackEvent(projectId, {
          type: event.type,
          properties: event.properties,
          sessionId: event.sessionId,
          userId: event.userId,
          timestamp: new Date(event.timestamp),
          pageUrl: event.url
        });

        // Check for A/B test conversions
        if (isConversionEvent(event.type)) {
          await handleConversionEvent(event, projectId);
        }

        processedEvents.push({
          eventId: event.sessionId + '_' + event.timestamp,
          status: 'processed'
        });

      } catch (eventError) {
        console.error('Error processing event:', eventError);
        processedEvents.push({
          eventId: event.sessionId + '_' + event.timestamp,
          status: 'error',
          error: eventError instanceof Error ? eventError.message : 'Unknown error'
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      events: processedEvents
    });

  } catch (error) {
    console.error('Error in tracking endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function isConversionEvent(eventType: string): boolean {
  const conversionEvents = [
    'conversion',
    'purchase',
    'signup',
    'subscribe',
    'download',
    'contact',
    'goal_completed'
  ];
  
  return conversionEvents.includes(eventType.toLowerCase());
}

async function handleConversionEvent(event: any, projectId: string): Promise<void> {
  try {
    // Get active experiments for this user/session
    const activeExperiments = await prisma.experiment.findMany({
      where: {
        projectId,
        status: 'RUNNING'
      },
      include: {
        variants: true
      }
    });

    // Find which experiments this user was allocated to
    for (const experiment of activeExperiments) {
      // Check if user was allocated to this experiment
      const allocation = await abTestingEngine.allocateVariant(
        experiment.id,
        event.userId || event.sessionId
      );

      if (allocation) {
        // Record conversion for the variant
        const conversionValue = event.properties?.value || 0;
        
        await abTestingEngine.recordConversion(
          experiment.id,
          allocation.variantId,
          event.userId || event.sessionId,
          conversionValue
        );
      }
    }
  } catch (error) {
    console.error('Error handling conversion event:', error);
  }
}

// Rate limiting middleware (simplified)
const rateLimitMap = new Map();

function rateLimit(ip: string, limit: number = 1000, window: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - window;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  return true;
}