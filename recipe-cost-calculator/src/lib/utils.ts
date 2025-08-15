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
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

export function formatPercentage(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
    ...options,
  }).format(value)
}

export function formatWeight(
  value: number,
  unit: string = 'g',
  locale: string = 'en-US'
): string {
  const formatted = formatNumber(value, locale)
  return `${formatted} ${unit}`
}

export function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  // Basic unit conversion matrix
  const conversions: Record<string, Record<string, number>> = {
    // Weight conversions (to grams)
    g: { g: 1, kg: 0.001, oz: 0.035274, lb: 0.002205 },
    kg: { g: 1000, kg: 1, oz: 35.274, lb: 2.205 },
    oz: { g: 28.3495, kg: 0.0283495, oz: 1, lb: 0.0625 },
    lb: { g: 453.592, kg: 0.453592, oz: 16, lb: 1 },
    
    // Volume conversions (to ml)
    ml: { ml: 1, l: 0.001, 'fl oz': 0.033814, cup: 0.00422675, tsp: 0.202884, tbsp: 0.067628 },
    l: { ml: 1000, l: 1, 'fl oz': 33.814, cup: 4.22675, tsp: 202.884, tbsp: 67.628 },
    'fl oz': { ml: 29.5735, l: 0.0295735, 'fl oz': 1, cup: 0.125, tsp: 6, tbsp: 2 },
    cup: { ml: 236.588, l: 0.236588, 'fl oz': 8, cup: 1, tsp: 48, tbsp: 16 },
    tsp: { ml: 4.92892, l: 0.00492892, 'fl oz': 0.166667, cup: 0.0208333, tsp: 1, tbsp: 0.333333 },
    tbsp: { ml: 14.7868, l: 0.0147868, 'fl oz': 0.5, cup: 0.0625, tsp: 3, tbsp: 1 },
    
    // Count/piece units
    piece: { piece: 1, dozen: 0.083333 },
    dozen: { piece: 12, dozen: 1 },
  }

  const fromConversions = conversions[fromUnit]
  if (!fromConversions || !fromConversions[toUnit]) {
    // If no conversion available, return original value
    return value
  }

  return value * fromConversions[toUnit]
}

export function calculatePricePerUnit(
  totalPrice: number,
  quantity: number,
  unit: string
): number {
  if (quantity === 0) return 0
  return totalPrice / quantity
}

export function calculateRecipeCost(ingredients: Array<{
  quantity: number
  unitPrice: number
}>): number {
  return ingredients.reduce((total, ingredient) => {
    return total + (ingredient.quantity * ingredient.unitPrice)
  }, 0)
}

export function calculateProfitMargin(
  sellingPrice: number,
  cost: number
): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - cost) / sellingPrice) * 100
}

export function calculateMarkup(
  sellingPrice: number,
  cost: number
): number {
  if (cost === 0) return 0
  return ((sellingPrice - cost) / cost) * 100
}

export function calculateSellingPrice(
  cost: number,
  targetProfitMargin: number
): number {
  if (targetProfitMargin >= 100) return cost * 2 // Fallback for invalid margin
  return cost / (1 - targetProfitMargin / 100)
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
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function formatDateRelative(date: Date, locale: string = 'en-US'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diff = Date.now() - date.getTime()
  const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diff / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diff / (1000 * 60))
      return rtf.format(-diffInMinutes, 'minute')
    }
    return rtf.format(-diffInHours, 'hour')
  }
  
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day')
  }
  
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7)
    return rtf.format(-diffInWeeks, 'week')
  }
  
  if (diffInDays < 365) {
    const diffInMonths = Math.floor(diffInDays / 30)
    return rtf.format(-diffInMonths, 'month')
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return rtf.format(-diffInYears, 'year')
}

export function downloadAsJSON(data: any, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function downloadAsCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function roundToDecimals(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}