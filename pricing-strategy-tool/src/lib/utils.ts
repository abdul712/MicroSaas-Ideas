import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

export function formatPercentage(
  value: number | string,
  decimals: number = 1
): string {
  const numericValue = typeof value === "string" ? parseFloat(value) : value
  return `${numericValue.toFixed(decimals)}%`
}

export function calculatePriceChange(
  oldPrice: number,
  newPrice: number
): {
  change: number
  percentage: number
  direction: "up" | "down" | "same"
} {
  const change = newPrice - oldPrice
  const percentage = oldPrice > 0 ? (change / oldPrice) * 100 : 0
  
  let direction: "up" | "down" | "same" = "same"
  if (change > 0) direction = "up"
  else if (change < 0) direction = "down"
  
  return { change, percentage, direction }
}

export function calculateMargin(price: number, cost: number): number {
  if (cost === 0) return 100
  return ((price - cost) / price) * 100
}

export function calculateMarkup(price: number, cost: number): number {
  if (cost === 0) return 0
  return ((price - cost) / cost) * 100
}

export function generateSKU(name: string, length: number = 8): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
  
  const suffix = Math.random()
    .toString(36)
    .substring(2, length - prefix.length + 2)
    .toUpperCase()
  
  return `${prefix}${suffix}`
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

export function getCompetitivePosition(
  yourPrice: number,
  competitorPrices: number[]
): {
  position: "lowest" | "highest" | "middle" | "competitive"
  rank: number
  percentile: number
} {
  if (competitorPrices.length === 0) {
    return { position: "competitive", rank: 1, percentile: 50 }
  }
  
  const allPrices = [...competitorPrices, yourPrice].sort((a, b) => a - b)
  const rank = allPrices.indexOf(yourPrice) + 1
  const percentile = (rank / allPrices.length) * 100
  
  let position: "lowest" | "highest" | "middle" | "competitive"
  
  if (rank === 1) position = "lowest"
  else if (rank === allPrices.length) position = "highest"
  else if (percentile >= 40 && percentile <= 60) position = "competitive"
  else position = "middle"
  
  return { position, rank, percentile }
}

export function calculateRecommendedPrice(
  cost: number,
  targetMargin: number,
  competitorPrices: number[] = [],
  strategy: "cost-plus" | "competitive" | "value-based" = "cost-plus"
): number {
  switch (strategy) {
    case "cost-plus":
      return cost / (1 - targetMargin / 100)
    
    case "competitive":
      if (competitorPrices.length === 0) return cost / (1 - targetMargin / 100)
      
      const avgCompetitorPrice = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length
      const costPlusPrice = cost / (1 - targetMargin / 100)
      
      // Position slightly below average competitor price but above cost-plus minimum
      return Math.max(costPlusPrice, avgCompetitorPrice * 0.95)
    
    case "value-based":
      // For value-based pricing, use competitor median as baseline
      if (competitorPrices.length === 0) return cost / (1 - targetMargin / 100)
      
      const sortedPrices = [...competitorPrices].sort((a, b) => a - b)
      const median = sortedPrices[Math.floor(sortedPrices.length / 2)]
      
      return Math.max(cost / (1 - targetMargin / 100), median * 1.1)
    
    default:
      return cost / (1 - targetMargin / 100)
  }
}

export function validatePriceRange(
  price: number,
  minPrice?: number,
  maxPrice?: number
): { isValid: boolean; message?: string } {
  if (minPrice && price < minPrice) {
    return { isValid: false, message: `Price cannot be below ${formatCurrency(minPrice)}` }
  }
  
  if (maxPrice && price > maxPrice) {
    return { isValid: false, message: `Price cannot be above ${formatCurrency(maxPrice)}` }
  }
  
  return { isValid: true }
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  
  if (startDate.getFullYear() === endDate.getFullYear()) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${formatter.formatToParts(startDate)[0].value} ${formatter.formatToParts(startDate)[2].value} - ${formatter.formatToParts(endDate)[2].value}, ${formatter.formatToParts(startDate)[4].value}`
    }
    return `${formatter.formatToParts(startDate)[0].value} ${formatter.formatToParts(startDate)[2].value} - ${formatter.format(endDate)}`
  }
  
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

export function generateColors(count: number): string[] {
  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1"
  ]
  
  if (count <= colors.length) {
    return colors.slice(0, count)
  }
  
  // Generate additional colors if needed
  const additionalColors = []
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360
    additionalColors.push(`hsl(${hue}, 70%, 50%)`)
  }
  
  return [...colors, ...additionalColors]
}