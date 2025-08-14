import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateSeoScore(scores: Record<string, number>): number {
  const weights = {
    technical: 0.25,
    content: 0.25,
    keywords: 0.20,
    performance: 0.15,
    meta: 0.15,
  }
  
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(weights).forEach(([category, weight]) => {
    if (scores[category] !== undefined) {
      totalScore += scores[category] * weight
      totalWeight += weight
    }
  })
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
}

export function getSeoScoreColor(score: number): string {
  if (score >= 90) return 'text-seo-excellent'
  if (score >= 75) return 'text-seo-good'
  if (score >= 60) return 'text-seo-fair'
  if (score >= 40) return 'text-seo-poor'
  return 'text-seo-critical'
}

export function getSeoScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-seo-excellent'
  if (score >= 75) return 'bg-seo-good'
  if (score >= 60) return 'bg-seo-fair'
  if (score >= 40) return 'bg-seo-poor'
  return 'bg-seo-critical'
}

export function getSeoScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Poor'
  return 'Critical'
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

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function parseMetaDescription(html: string): string | null {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  return match ? match[1] : null
}

export function parseTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? match[1].trim() : null
}

export function parseMetaKeywords(html: string): string[] {
  const match = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i)
  return match ? match[1].split(',').map(k => k.trim()).filter(Boolean) : []
}

export function calculateReadabilityScore(text: string): number {
  // Simplified Flesch Reading Ease score
  const sentences = text.split(/[.!?]+/).filter(Boolean).length
  const words = text.split(/\s+/).filter(Boolean).length
  const syllables = words.reduce((acc, word) => {
    return acc + countSyllables(word)
  }, 0)
  
  if (sentences === 0 || words === 0) return 0
  
  const avgSentenceLength = words / sentences
  const avgSyllablesPerWord = syllables / words
  
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function countSyllables(word: string): number {
  word = word.toLowerCase()
  if (word.length <= 3) return 1
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}