import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export function calculateDifficultyScore(postCount: number, avgEngagement: number): number {
  // Higher post count = higher difficulty
  // Higher engagement = lower difficulty
  const postCountScore = Math.min(postCount / 1000000, 1) * 70
  const engagementScore = Math.max(0, (5 - avgEngagement) / 5) * 30
  
  return Math.round(postCountScore + engagementScore)
}

export function generateHashtagScore(
  postCount: number,
  avgEngagement: number,
  trendScore: number
): number {
  const difficulty = calculateDifficultyScore(postCount, avgEngagement)
  const engagement = Math.min(avgEngagement * 20, 100)
  const trend = Math.min(trendScore * 100, 100)
  
  // Weighted score: 40% engagement, 30% trend, 30% difficulty (inverted)
  const score = (engagement * 0.4) + (trend * 0.3) + ((100 - difficulty) * 0.3)
  
  return Math.round(score)
}

export function getHashtagSize(postCount: number): 'small' | 'medium' | 'large' | 'viral' {
  if (postCount < 10000) return 'small'
  if (postCount < 100000) return 'medium'
  if (postCount < 1000000) return 'large'
  return 'viral'
}

export function validateHashtag(hashtag: string): boolean {
  // Remove # if present
  const tag = hashtag.replace('#', '')
  
  // Check if valid hashtag format
  return /^[a-zA-Z0-9_]+$/.test(tag) && tag.length > 0 && tag.length <= 100
}

export function sanitizeHashtag(hashtag: string): string {
  return hashtag.replace('#', '').toLowerCase().trim()
}

export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(2)}%`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 30) return 'text-green-600'
  if (difficulty <= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 30) return 'Easy'
  if (difficulty <= 60) return 'Medium'
  return 'Hard'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }) as T
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}