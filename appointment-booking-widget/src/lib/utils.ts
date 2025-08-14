import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
import { addMinutes, isBefore, isAfter, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time and date utilities for booking system
export const timeUtils = {
  /**
   * Format time for display in a given timezone
   */
  formatTimeInTimezone: (date: Date, timezone: string, formatStr: string = 'HH:mm') => {
    return formatInTimeZone(date, timezone, formatStr)
  },

  /**
   * Convert local time to UTC for database storage
   */
  localToUtc: (localTime: string, date: string, timezone: string): Date => {
    const localDateTime = new Date(`${date}T${localTime}`)
    return zonedTimeToUtc(localDateTime, timezone)
  },

  /**
   * Convert UTC time to local timezone for display
   */
  utcToLocal: (utcDate: Date, timezone: string): Date => {
    return utcToZonedTime(utcDate, timezone)
  },

  /**
   * Generate time slots for a given day
   */
  generateTimeSlots: (
    startTime: string, 
    endTime: string, 
    duration: number, 
    bufferTime: number = 0
  ): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    let current = new Date()
    current.setHours(startHour, startMin, 0, 0)
    
    const end = new Date()
    end.setHours(endHour, endMin, 0, 0)
    
    while (isBefore(current, end)) {
      const timeString = format(current, 'HH:mm')
      slots.push(timeString)
      current = addMinutes(current, duration + bufferTime)
    }
    
    return slots
  },

  /**
   * Check if a time slot conflicts with existing bookings
   */
  hasConflict: (
    newStart: Date,
    newEnd: Date,
    existingBookings: Array<{ startTime: Date; endTime: Date }>
  ): boolean => {
    return existingBookings.some(booking => {
      const bookingInterval = { start: booking.startTime, end: booking.endTime }
      const newInterval = { start: newStart, end: newEnd }
      
      return (
        isWithinInterval(newStart, bookingInterval) ||
        isWithinInterval(newEnd, bookingInterval) ||
        isWithinInterval(booking.startTime, newInterval) ||
        isWithinInterval(booking.endTime, newInterval)
      )
    })
  },

  /**
   * Get business hours for a specific day
   */
  getBusinessHours: (dayOfWeek: number, availability: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
  }>) => {
    return availability.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isActive
    )
  },

  /**
   * Check if a date/time is within business hours
   */
  isWithinBusinessHours: (
    dateTime: Date,
    availability: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
      isActive: boolean
    }>
  ): boolean => {
    const dayOfWeek = dateTime.getDay()
    const timeString = format(dateTime, 'HH:mm')
    
    const businessHours = availability.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isActive
    )
    
    return businessHours.some(hours => {
      return timeString >= hours.startTime && timeString <= hours.endTime
    })
  }
}

// Validation utilities
export const validation = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  },

  /**
   * Validate booking time constraints
   */
  validateBookingTime: (
    startTime: Date,
    serviceId: string,
    settings: {
      advanceBookingMin?: number // hours
      advanceBookingMax?: number // days
    }
  ): { isValid: boolean; message?: string } => {
    const now = new Date()
    
    // Check minimum advance booking time
    if (settings.advanceBookingMin) {
      const minTime = addMinutes(now, settings.advanceBookingMin * 60)
      if (isBefore(startTime, minTime)) {
        return {
          isValid: false,
          message: `Booking must be at least ${settings.advanceBookingMin} hours in advance`
        }
      }
    }
    
    // Check maximum advance booking time
    if (settings.advanceBookingMax) {
      const maxTime = addMinutes(now, settings.advanceBookingMax * 24 * 60)
      if (isAfter(startTime, maxTime)) {
        return {
          isValid: false,
          message: `Booking cannot be more than ${settings.advanceBookingMax} days in advance`
        }
      }
    }
    
    return { isValid: true }
  }
}

// Currency formatting utilities
export const currency = {
  /**
   * Format currency amount
   */
  format: (amount: number, currencyCode: string = 'USD', locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  },

  /**
   * Parse currency string to number
   */
  parse: (currencyString: string): number => {
    return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''))
  }
}

// URL and slug utilities
export const slug = {
  /**
   * Create URL-friendly slug
   */
  create: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },

  /**
   * Validate slug format
   */
  isValid: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugRegex.test(slug)
  }
}

// Error handling utilities
export const errors = {
  /**
   * Extract error message from various error types
   */
  getMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'An unexpected error occurred'
  },

  /**
   * Check if error is a known type
   */
  isNetworkError: (error: unknown): boolean => {
    return error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('NetworkError')
    )
  }
}

// Widget configuration utilities
export const widget = {
  /**
   * Generate widget embed code
   */
  generateEmbedCode: (businessSlug: string, options: {
    width?: string
    height?: string
    theme?: 'light' | 'dark'
    serviceId?: string
  } = {}): string => {
    const {
      width = '100%',
      height = '600px',
      theme = 'light',
      serviceId
    } = options

    const params = new URLSearchParams()
    if (serviceId) params.set('service', serviceId)
    if (theme) params.set('theme', theme)

    const src = `${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://widget.appointmentbooking.com'}/widget/${businessSlug}${params.toString() ? '?' + params.toString() : ''}`

    return `<iframe
  src="${src}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="Appointment Booking"
></iframe>`
  },

  /**
   * Generate JavaScript embed code
   */
  generateJSEmbedCode: (businessSlug: string, containerId: string, options: any = {}): string => {
    return `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://widget.appointmentbooking.com'}/widget.js';
  script.onload = function() {
    AppointmentWidget.init({
      businessSlug: '${businessSlug}',
      containerId: '${containerId}',
      options: ${JSON.stringify(options)}
    });
  };
  document.head.appendChild(script);
})();
</script>`
  }
}