import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeEventProperties } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events, apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      )
    }

    // Validate API key and get organization
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true },
      include: { organization: true }
    })

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() }
    })

    // Process events
    const processedEvents = []

    for (const event of events) {
      if (!event.eventType || !event.customerId) {
        continue // Skip invalid events
      }

      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: {
          orgId: apiKeyRecord.orgId,
          externalId: event.customerId
        }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            externalId: event.customerId,
            orgId: apiKeyRecord.orgId,
            attributes: {},
            firstSeen: new Date(),
            lastSeen: new Date()
          }
        })
      } else {
        // Update last seen
        await prisma.customer.update({
          where: { id: customer.id },
          data: { lastSeen: new Date() }
        })
      }

      // Sanitize properties
      const sanitizedProperties = sanitizeEventProperties(event.properties || {})

      // Create event record
      const eventRecord = await prisma.event.create({
        data: {
          eventType: event.eventType,
          properties: sanitizedProperties,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          sessionId: event.sessionId,
          customerId: customer.id,
          journeyId: event.journeyId
        }
      })

      processedEvents.push(eventRecord)
    }

    // Here you would also send events to ClickHouse for analytics
    // For demo purposes, we'll just use PostgreSQL
    
    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      message: `Successfully processed ${processedEvents.length} events`
    })

  } catch (error) {
    console.error('Error processing events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = searchParams.get('apiKey')
  const journeyId = searchParams.get('journeyId')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 401 }
    )
  }

  try {
    // Validate API key
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true }
    })

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Build query
    const where: any = {
      customer: {
        orgId: apiKeyRecord.orgId
      }
    }

    if (journeyId) {
      where.journeyId = journeyId
    }

    // Get events
    const events = await prisma.event.findMany({
      where,
      include: {
        customer: {
          select: {
            externalId: true,
            attributes: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return NextResponse.json({
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        properties: event.properties,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        customerId: event.customer.externalId,
        customerAttributes: event.customer.attributes,
        journeyId: event.journeyId
      }))
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}