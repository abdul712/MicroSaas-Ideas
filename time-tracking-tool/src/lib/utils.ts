import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, formatDuration, intervalToDuration } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format time duration in seconds to human readable format
 */
export function formatDurationFromSeconds(seconds: number): string {
  if (seconds < 60) {
    return '< 1 min'
  }

  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
  
  if (duration.hours && duration.hours > 0) {
    return `${duration.hours}h ${duration.minutes || 0}m`
  }
  
  return `${duration.minutes}m`
}

/**
 * Format time duration in seconds to detailed format (HH:MM:SS)
 */
export function formatDetailedDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Calculate duration in seconds between two dates
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate billable amount from duration and rate
 */
export function calculateBillableAmount(durationInSeconds: number, hourlyRate: number): number {
  const hours = durationInSeconds / 3600
  return hours * hourlyRate
}

/**
 * Round time to nearest interval (for billing)
 */
export function roundTimeToInterval(seconds: number, intervalMinutes: number = 15): number {
  const intervalSeconds = intervalMinutes * 60
  return Math.ceil(seconds / intervalSeconds) * intervalSeconds
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format date for relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

/**
 * Generate random color for projects
 */
export function generateProjectColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#059669', '#DC2626'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Parse time input (e.g., "2h 30m", "1.5h", "90m")
 */
export function parseTimeInput(input: string): number {
  const trimmed = input.trim().toLowerCase()
  
  // Handle formats like "2h 30m" or "2h30m"
  const hoursMinutesMatch = trimmed.match(/(\d+(?:\.\d+)?)h\s*(\d+(?:\.\d+)?)m/)
  if (hoursMinutesMatch) {
    const hours = parseFloat(hoursMinutesMatch[1])
    const minutes = parseFloat(hoursMinutesMatch[2])
    return Math.round((hours * 60 + minutes) * 60)
  }

  // Handle format like "2h" or "2.5h"
  const hoursMatch = trimmed.match(/(\d+(?:\.\d+)?)h/)
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1])
    return Math.round(hours * 3600)
  }

  // Handle format like "30m" or "90m"
  const minutesMatch = trimmed.match(/(\d+(?:\.\d+)?)m/)
  if (minutesMatch) {
    const minutes = parseFloat(minutesMatch[1])
    return Math.round(minutes * 60)
  }

  // Handle decimal hours (e.g., "1.5")
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/)
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1])
    return Math.round(hours * 3600)
  }

  return 0
}

/**
 * Get user initials from name
 */
export function getUserInitials(name?: string | null): string {
  if (!name) return 'U'
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if date is this week
 */
export function isThisWeek(date: Date): boolean {
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  
  return date >= startOfWeek && date <= endOfWeek
}

/**
 * Get week start and end dates
 */
export function getWeekDates(date: Date = new Date()) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Get month start and end dates
 */
export function getMonthDates(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get contrast color for background
 */
export function getContrastColor(hexColor: string): string {
  // Remove the hash if it exists
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}