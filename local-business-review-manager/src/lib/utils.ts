import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return formatDate(d)
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)
  
  return { full, half: hasHalf, empty }
}

export function getSentimentColor(sentiment: string | null): string {
  if (!sentiment) return 'text-gray-500'
  
  switch (sentiment.toLowerCase()) {
    case 'positive': return 'text-green-600'
    case 'negative': return 'text-red-600'
    case 'neutral': return 'text-yellow-600'
    default: return 'text-gray-500'
  }
}

export function getSentimentBadgeClass(sentiment: string | null): string {
  if (!sentiment) return 'bg-gray-100 text-gray-800'
  
  switch (sentiment.toLowerCase()) {
    case 'positive': return 'sentiment-positive'
    case 'negative': return 'sentiment-negative'
    case 'neutral': return 'sentiment-neutral'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'google': return 'platform-google'
    case 'yelp': return 'platform-yelp'
    case 'facebook': return 'platform-facebook'
    case 'tripadvisor': return 'platform-tripadvisor'
    case 'trustpilot': return 'platform-trustpilot'
    default: return 'bg-gray-500 text-white'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'low': return 'priority-low'
    case 'medium': return 'priority-medium'
    case 'high': return 'priority-high'
    case 'urgent': return 'priority-urgent'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'reviewed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'responded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'escalated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'resolved': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function generateAvatarUrl(name: string): string {
  const cleanName = encodeURIComponent(name.trim())
  return `https://ui-avatars.com/api/?name=${cleanName}&background=3b82f6&color=ffffff&size=40&rounded=true`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/^1(\d{3})(\d{3})(\d{4})$/, '+1 ($1) $2-$3')
  }
  
  return phone
}

export function generateQRCodeUrl(data: string, size = 200): string {
  const encodedData = encodeURIComponent(data)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&bgcolor=ffffff&color=000000&margin=10`
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function calculateSentimentScore(text: string): number {
  // Simple sentiment analysis based on keywords
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'best', 'awesome']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'poor', 'disappointing', 'useless']
  
  const words = text.toLowerCase().split(/\s+/)
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1
    if (negativeWords.includes(word)) score -= 1
  })
  
  // Normalize to -1 to 1 scale
  const maxWords = Math.max(positiveWords.length, negativeWords.length)
  return Math.max(-1, Math.min(1, score / maxWords))
}

export function getSentimentLabel(score: number): string {
  if (score > 0.1) return 'positive'
  if (score < -0.1) return 'negative'
  return 'neutral'
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function isValidBusinessHours(hours: string): boolean {
  const hoursRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return hoursRegex.test(hours)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

export function isWithinBusinessHours(hours: string, date = new Date()): boolean {
  if (!isValidBusinessHours(hours)) return false
  
  const [startTime, endTime] = hours.split('-').map(t => t.trim())
  const [startHour, startMin] = startTime.split(':').map(n => parseInt(n))
  const [endHour, endMin] = endTime.split(':').map(n => parseInt(n))
  
  const currentHour = date.getHours()
  const currentMin = date.getMinutes()
  const currentTimeInMin = currentHour * 60 + currentMin
  const startTimeInMin = startHour * 60 + startMin
  const endTimeInMin = endHour * 60 + endMin
  
  return currentTimeInMin >= startTimeInMin && currentTimeInMin <= endTimeInMin
}