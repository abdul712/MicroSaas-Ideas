import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num
  
  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(1) + 'B'
  }
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return n.toString()
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function generateHashtagId(tag: string, platform: string): string {
  return `${platform.toLowerCase()}_${tag.toLowerCase().replace('#', '')}`
}

export function normalizeHashtag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function validateHashtag(tag: string): boolean {
  const normalized = normalizeHashtag(tag)
  return normalized.length > 0 && normalized.length <= 100
}

export function calculateDifficultyScore(postCount: bigint, avgEngagement: number): number {
  const posts = Number(postCount)
  
  // Difficulty increases with post count, decreases with engagement
  const countScore = Math.min(posts / 10000000, 1) // 10M posts = max difficulty from count
  const engagementScore = Math.max(0, 1 - avgEngagement) // Lower engagement = higher difficulty
  
  return (countScore * 0.7 + engagementScore * 0.3) * 100
}

export function calculateTrendScore(
  recentGrowth: number,
  velocityChange: number,
  seasonality: number = 0
): number {
  // Combine growth rate, velocity change, and seasonal factors
  const growthScore = Math.min(recentGrowth / 100, 1) // Cap at 100% growth
  const velocityScore = Math.max(0, Math.min(velocityChange, 1))
  const seasonalityScore = seasonality
  
  return (growthScore * 0.5 + velocityScore * 0.3 + seasonalityScore * 0.2) * 100
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
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}