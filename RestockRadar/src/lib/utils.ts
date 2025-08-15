import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(
  number: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(number)
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

export function formatRelativeTime(
  date: Date | string,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second')
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
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

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function round(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function generateRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function parseSearchParams(searchParams: string): Record<string, string> {
  const params = new URLSearchParams(searchParams)
  const result: Record<string, string> = {}
  
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  
  return result
}

export function buildSearchParams(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(err => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay * 2))
    }
    throw err
  })
}

// Inventory-specific utilities
export function calculateReorderPoint(
  averageDailySales: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  return Math.ceil((averageDailySales * leadTimeDays) + (averageDailySales * safetyStockDays))
}

export function calculateInventoryTurnover(
  costOfGoodsSold: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue === 0) return 0
  return costOfGoodsSold / averageInventoryValue
}

export function calculateDaysOfInventory(
  currentInventoryValue: number,
  averageDailyCogs: number
): number {
  if (averageDailyCogs === 0) return 0
  return currentInventoryValue / averageDailyCogs
}

export function classifyABC(
  items: Array<{ value: number }>,
  aThreshold: number = 0.8,
  bThreshold: number = 0.95
): Array<'A' | 'B' | 'C'> {
  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  let cumulativeValue = 0
  
  return items
    .sort((a, b) => b.value - a.value)
    .map(item => {
      cumulativeValue += item.value
      const cumulativePercent = cumulativeValue / totalValue
      
      if (cumulativePercent <= aThreshold) return 'A'
      if (cumulativePercent <= bThreshold) return 'B'
      return 'C'
    })
}

export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCost: number
): number {
  if (holdingCost === 0) return 0
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
}

export function calculateSafetyStock(
  maxDailyUsage: number,
  averageDailyUsage: number,
  maxLeadTime: number,
  averageLeadTime: number
): number {
  return (maxDailyUsage * maxLeadTime) - (averageDailyUsage * averageLeadTime)
}

export function getInventoryStatus(
  currentStock: number,
  reorderPoint: number,
  maxStock: number
): 'low' | 'normal' | 'high' | 'out' {
  if (currentStock === 0) return 'out'
  if (currentStock <= reorderPoint) return 'low'
  if (currentStock >= maxStock) return 'high'
  return 'normal'
}

export function formatInventoryStatus(status: 'low' | 'normal' | 'high' | 'out'): {
  label: string
  color: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  switch (status) {
    case 'out':
      return {
        label: 'Out of Stock',
        color: 'text-red-600',
        variant: 'destructive'
      }
    case 'low':
      return {
        label: 'Low Stock',
        color: 'text-yellow-600',
        variant: 'outline'
      }
    case 'high':
      return {
        label: 'Overstock',
        color: 'text-blue-600',
        variant: 'secondary'
      }
    default:
      return {
        label: 'Normal',
        color: 'text-green-600',
        variant: 'default'
      }
  }
}