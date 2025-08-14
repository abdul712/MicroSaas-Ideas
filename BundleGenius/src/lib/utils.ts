import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat("en-US").format(number)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(dateObj)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0
  return ((originalPrice - discountedPrice) / originalPrice) * 100
}

export function calculateBundlePrice(
  items: Array<{ price: number; quantity: number }>,
  pricingType: string,
  discountValue?: number,
  fixedPrice?: number
): number {
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  switch (pricingType) {
    case "PERCENTAGE_DISCOUNT":
      return totalPrice * (1 - (discountValue || 0))
    case "FIXED_DISCOUNT":
      return Math.max(0, totalPrice - (discountValue || 0))
    case "FIXED_PRICE":
      return fixedPrice || totalPrice
    case "BUY_X_GET_Y":
      // Simplified - would need more complex logic for real implementation
      return totalPrice * 0.8
    default:
      return totalPrice
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "delivered":
    case "paid":
      return "text-green-600 bg-green-50 border-green-200"
    case "draft":
    case "pending":
    case "processing":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "inactive":
    case "canceled":
    case "refunded":
      return "text-red-600 bg-red-50 border-red-200"
    case "scheduled":
    case "shipped":
    case "authorized":
      return "text-blue-600 bg-blue-50 border-blue-200"
    case "archived":
    case "expired":
      return "text-gray-600 bg-gray-50 border-gray-200"
    default:
      return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
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

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], keyFn: (item: T) => any, order: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aValue = keyFn(a)
    const bValue = keyFn(b)
    
    if (aValue < bValue) return order === "asc" ? -1 : 1
    if (aValue > bValue) return order === "asc" ? 1 : -1
    return 0
  })
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const attempt = async () => {
      try {
        attempts++
        const result = await fn()
        resolve(result)
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error)
        } else {
          setTimeout(attempt, delay * Math.pow(2, attempts - 1)) // Exponential backoff
        }
      }
    }
    
    attempt()
  })
}