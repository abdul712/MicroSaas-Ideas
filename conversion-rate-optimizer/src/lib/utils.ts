import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function generateTrackingId(): string {
  return 'cro_' + generateId()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
}

export function calculateStatisticalSignificance(
  controlConversions: number,
  controlVisitors: number,
  variationConversions: number,
  variationVisitors: number
): number {
  const p1 = controlConversions / controlVisitors
  const p2 = variationConversions / variationVisitors
  
  const pooledProbability = (controlConversions + variationConversions) / (controlVisitors + variationVisitors)
  const standardError = Math.sqrt(pooledProbability * (1 - pooledProbability) * (1/controlVisitors + 1/variationVisitors))
  
  if (standardError === 0) return 0
  
  const zScore = Math.abs(p1 - p2) / standardError
  
  // Convert Z-score to confidence level (simplified)
  const confidence = (1 - 2 * (1 - normalCDF(zScore))) * 100
  return Math.max(0, Math.min(100, confidence))
}

function normalCDF(x: number): number {
  // Approximation of normal cumulative distribution function
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - prob : prob
}

export function calculateConversionLift(
  controlRate: number,
  variationRate: number
): number {
  if (controlRate === 0) return 0
  return ((variationRate - controlRate) / controlRate) * 100
}

export function calculateSampleSize(
  baseline: number,
  minimumDetectableEffect: number,
  power = 0.8,
  alpha = 0.05
): number {
  // Simplified sample size calculation for A/B tests
  const zAlpha = 1.96 // 95% confidence
  const zBeta = 0.84 // 80% power
  
  const p1 = baseline
  const p2 = baseline * (1 + minimumDetectableEffect / 100)
  
  const pooledP = (p1 + p2) / 2
  const delta = Math.abs(p2 - p1)
  
  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2)
  const denominator = Math.pow(delta, 2)
  
  return Math.ceil(numerator / denominator)
}

export function isTestStatisticallySignificant(
  confidence: number,
  threshold = 95
): boolean {
  return confidence >= threshold
}

export class ColorUtils {
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      active: 'green',
      running: 'blue',
      completed: 'purple',
      paused: 'yellow',
      draft: 'gray',
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green',
    }
    return statusColors[status.toLowerCase()] || 'gray'
  }

  static getConversionColor(lift: number): string {
    if (lift > 10) return 'green'
    if (lift > 0) return 'blue'
    if (lift > -5) return 'yellow'
    return 'red'
  }
}

export class DateUtils {
  static getDateRange(period: string) {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(now.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        now.setDate(now.getDate() - 1)
        now.setHours(23, 59, 59, 999)
        break
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    return { startDate, endDate: now }
  }
}