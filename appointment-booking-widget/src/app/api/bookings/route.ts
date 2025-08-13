import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { timeUtils, validation } from '@/lib/utils'
import { z } from 'zod'

// Input validation schemas
const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  startTime: z.string().datetime(),
  timezone: z.string().default('UTC'),
  notes: z.string().optional(),
  source: z.string().default('widget'),
  utmParams: z.record(z.string()).optional()
})

const querySchema = z.object({
  businessId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0')
})

// GET /api/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const whereClause: any = {}
    
    if (query.businessId) {
      whereClause.businessId = query.businessId
    }
    
    if (query.status) {
      whereClause.status = query.status
    }
    
    if (query.startDate || query.endDate) {
      whereClause.startTime = {}
      if (query.startDate) {
        whereClause.startTime.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        whereClause.startTime.lte = new Date(query.endDate)
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true
            }
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              type: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: query.limit,
        skip: query.offset
      }),
      prisma.booking.count({ where: whereClause })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Fetch business, service, and staff details
    const [business, service, staff] = await Promise.all([
      prisma.business.findUnique({
        where: { id: validatedData.businessId },
        include: { settings: true }
      }),
      prisma.service.findUnique({
        where: { id: validatedData.serviceId }
      }),
      prisma.staff.findUnique({
        where: { id: validatedData.staffId },
        include: { availability: true }
      })
    ])

    if (!business || !service || !staff) {
      return NextResponse.json(
        { error: 'Business, service, or staff not found' },
        { status: 404 }
      )
    }

    // Convert start time to UTC
    const startTimeUTC = timeUtils.localToUtc(
      validatedData.startTime,
      validatedData.startTime.split('T')[0],
      validatedData.timezone
    )
    
    const endTimeUTC = new Date(startTimeUTC.getTime() + service.duration * 60000)

    // Validate booking time constraints
    const timeValidation = validation.validateBookingTime(
      startTimeUTC,
      service.id,
      {
        advanceBookingMin: service.advanceBookingMin || undefined,
        advanceBookingMax: service.advanceBookingMax || undefined
      }
    )

    if (!timeValidation.isValid) {
      return NextResponse.json(
        { error: timeValidation.message },
        { status: 400 }
      )
    }

    // Check availability
    const existingBookings = await prisma.booking.findMany({
      where: {
        staffId: validatedData.staffId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTimeUTC } },
              { endTime: { gt: startTimeUTC } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTimeUTC } },
              { endTime: { gte: endTimeUTC } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTimeUTC } },
              { endTime: { lte: endTimeUTC } }
            ]
          }
        ]
      }
    })

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      )
    }

    // Check if customer exists, create if not
    let customer = await prisma.customer.findUnique({
      where: {
        businessId_email: {
          businessId: validatedData.businessId,
          email: validatedData.customerEmail
        }
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: validatedData.businessId,
          name: validatedData.customerName,
          email: validatedData.customerEmail,
          phone: validatedData.customerPhone
        }
      })
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        businessId: validatedData.businessId,
        serviceId: validatedData.serviceId,
        staffId: validatedData.staffId,
        customerId: customer.id,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        totalPrice: service.price,
        notes: validatedData.notes,
        source: validatedData.source,
        utmParams: validatedData.utmParams
      },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    // Update customer statistics
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalBookings: { increment: 1 },
        lastBookingAt: new Date()
      }
    })

    // TODO: Queue notification jobs
    // await notificationQueue.add('booking-confirmation', {
    //   bookingId: booking.id,
    //   type: 'customer'
    // })

    // TODO: Queue calendar sync job
    // await calendarQueue.add('sync-booking', {
    //   bookingId: booking.id,
    //   action: 'create'
    // })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}