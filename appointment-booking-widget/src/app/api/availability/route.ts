import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { timeUtils } from '@/lib/utils'
import { z } from 'zod'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'

// Input validation schema
const availabilityQuerySchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  timezone: z.string().default('UTC'),
  days: z.string().transform(Number).default('7').pipe(z.number().min(1).max(30))
})

interface TimeSlot {
  time: string
  available: boolean
  staffId?: string
  staffName?: string
}

interface DayAvailability {
  date: string
  dayOfWeek: number
  isAvailable: boolean
  slots: TimeSlot[]
}

// GET /api/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = availabilityQuerySchema.parse(Object.fromEntries(searchParams))

    // Fetch service details
    const service = await prisma.service.findUnique({
      where: { id: query.serviceId },
      include: {
        business: {
          select: {
            timezone: true,
            settings: true
          }
        },
        staffServices: {
          include: {
            staff: {
              include: {
                availability: {
                  where: { isActive: true }
                }
              }
            }
          },
          where: { isActive: true }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Filter staff if specific staff member requested
    let availableStaff = service.staffServices.map(ss => ss.staff)
    if (query.staffId) {
      availableStaff = availableStaff.filter(staff => staff.id === query.staffId)
      if (availableStaff.length === 0) {
        return NextResponse.json(
          { error: 'Staff member not found or not available for this service' },
          { status: 404 }
        )
      }
    }

    const businessTimezone = service.business.timezone
    const startDate = new Date(query.date)
    const availability: DayAvailability[] = []

    // Generate availability for requested number of days
    for (let i = 0; i < query.days; i++) {
      const currentDate = addDays(startDate, i)
      const dayOfWeek = currentDate.getDay()
      const dateString = format(currentDate, 'yyyy-MM-dd')

      // Get staff availability for this day
      const dayAvailability: DayAvailability = {
        date: dateString,
        dayOfWeek,
        isAvailable: false,
        slots: []
      }

      for (const staff of availableStaff) {
        const staffAvailability = staff.availability.filter(
          avail => avail.dayOfWeek === dayOfWeek
        )

        if (staffAvailability.length === 0) {
          continue // Staff not available this day
        }

        // Generate time slots for each availability period
        for (const availPeriod of staffAvailability) {
          const slots = timeUtils.generateTimeSlots(
            availPeriod.startTime,
            availPeriod.endTime,
            service.duration,
            service.bufferTimeBefore + service.bufferTimeAfter
          )

          // Check existing bookings for this staff member
          const dayStart = startOfDay(currentDate)
          const dayEnd = endOfDay(currentDate)

          const existingBookings = await prisma.booking.findMany({
            where: {
              staffId: staff.id,
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              startTime: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            select: {
              startTime: true,
              endTime: true
            }
          })

          // Check availability for each slot
          for (const slotTime of slots) {
            const slotStart = timeUtils.localToUtc(slotTime, dateString, businessTimezone)
            const slotEnd = new Date(slotStart.getTime() + service.duration * 60000)

            // Check if slot conflicts with existing bookings
            const hasConflict = timeUtils.hasConflict(slotStart, slotEnd, existingBookings)

            // Check if slot is in the past
            const now = new Date()
            const isPast = slotStart <= now

            // Check business rules
            const minAdvanceMs = (service.advanceBookingMin || 0) * 60 * 60 * 1000
            const maxAdvanceMs = (service.advanceBookingMax || 365) * 24 * 60 * 60 * 1000
            const timeDiff = slotStart.getTime() - now.getTime()
            
            const violatesMinAdvance = timeDiff < minAdvanceMs
            const violatesMaxAdvance = timeDiff > maxAdvanceMs

            const available = !hasConflict && !isPast && !violatesMinAdvance && !violatesMaxAdvance

            dayAvailability.slots.push({
              time: slotTime,
              available,
              staffId: staff.id,
              staffName: staff.name
            })

            if (available) {
              dayAvailability.isAvailable = true
            }
          }
        }
      }

      // Sort slots by time and remove duplicates
      dayAvailability.slots.sort((a, b) => a.time.localeCompare(b.time))
      
      // If multiple staff available for same slot, prefer available ones
      const uniqueSlots = new Map<string, TimeSlot>()
      dayAvailability.slots.forEach(slot => {
        const existing = uniqueSlots.get(slot.time)
        if (!existing || (slot.available && !existing.available)) {
          uniqueSlots.set(slot.time, slot)
        }
      })
      
      dayAvailability.slots = Array.from(uniqueSlots.values())

      availability.push(dayAvailability)
    }

    // Calculate summary statistics
    const totalSlots = availability.reduce((sum, day) => sum + day.slots.length, 0)
    const availableSlots = availability.reduce(
      (sum, day) => sum + day.slots.filter(slot => slot.available).length, 
      0
    )
    const availableDays = availability.filter(day => day.isAvailable).length

    return NextResponse.json({
      availability,
      summary: {
        totalDays: query.days,
        availableDays,
        totalSlots,
        availableSlots,
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price
        },
        business: {
          timezone: businessTimezone
        }
      }
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// POST /api/availability/check - Check specific time slot availability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const checkSchema = z.object({
      businessId: z.string().cuid(),
      serviceId: z.string().cuid(),
      staffId: z.string().cuid(),
      startTime: z.string().datetime(),
      timezone: z.string().default('UTC')
    })

    const data = checkSchema.parse(body)

    // Fetch service details
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Convert to UTC
    const startTimeUTC = timeUtils.localToUtc(
      data.startTime,
      data.startTime.split('T')[0],
      data.timezone
    )
    const endTimeUTC = new Date(startTimeUTC.getTime() + service.duration * 60000)

    // Check for conflicts
    const existingBookings = await prisma.booking.findMany({
      where: {
        staffId: data.staffId,
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

    const hasConflict = existingBookings.length > 0

    // Check business rules
    const now = new Date()
    const isPast = startTimeUTC <= now
    
    const minAdvanceMs = (service.advanceBookingMin || 0) * 60 * 60 * 1000
    const maxAdvanceMs = (service.advanceBookingMax || 365) * 24 * 60 * 60 * 1000
    const timeDiff = startTimeUTC.getTime() - now.getTime()
    
    const violatesMinAdvance = timeDiff < minAdvanceMs
    const violatesMaxAdvance = timeDiff > maxAdvanceMs

    const available = !hasConflict && !isPast && !violatesMinAdvance && !violatesMaxAdvance

    let reason = null
    if (!available) {
      if (hasConflict) reason = 'Time slot is already booked'
      else if (isPast) reason = 'Time slot is in the past'
      else if (violatesMinAdvance) reason = `Must book at least ${service.advanceBookingMin} hours in advance`
      else if (violatesMaxAdvance) reason = `Cannot book more than ${service.advanceBookingMax} days in advance`
    }

    return NextResponse.json({
      available,
      reason,
      slot: {
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString(),
        duration: service.duration
      }
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}