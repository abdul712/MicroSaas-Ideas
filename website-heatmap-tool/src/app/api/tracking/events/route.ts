import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { ratelimit } from '@/lib/ratelimit'
import { trackingService } from '@/services/tracking-service'
import { validateTrackingEvent } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Rate limiting
    const clientIP = request.ip || 'unknown'
    const { success, limit, reset, remaining } = await ratelimit.limit(clientIP)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tracking_id, events } = body

    // Validate tracking ID
    if (!tracking_id || typeof tracking_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid tracking ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate events array
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Too many events in batch (max 100)' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate and sanitize each event
    const validEvents = []
    for (const event of events) {
      try {
        const validatedEvent = validateTrackingEvent(event)
        if (validatedEvent) {
          validEvents.push(validatedEvent)
        }
      } catch (error) {
        console.warn('Invalid event:', error, event)
        // Continue processing other events
      }
    }

    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events found' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user agent and IP for context
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = forwardedFor?.split(',')[0] || clientIP

    // Process events
    await trackingService.processEvents(tracking_id, validEvents, {
      userAgent,
      ip: realIP,
      timestamp: new Date(),
    })

    return NextResponse.json(
      { 
        success: true, 
        processed: validEvents.length,
        skipped: events.length - validEvents.length
      },
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    )

  } catch (error) {
    console.error('Tracking API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}