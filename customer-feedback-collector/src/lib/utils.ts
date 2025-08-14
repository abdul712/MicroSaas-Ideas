import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + '...' : str
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

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num)
}

export function getRelativeTime(date: Date | string) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return formatDate(target)
  }
}

export function getSentimentColor(sentiment: string) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return 'text-green-600 bg-green-50 dark:bg-green-950'
    case 'negative':
      return 'text-red-600 bg-red-50 dark:bg-red-950'
    case 'neutral':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
  }
}

export function getFeedbackTypeColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'bug_report':
      return 'text-red-600 bg-red-50 dark:bg-red-950'
    case 'feature_request':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
    case 'rating':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'nps':
      return 'text-purple-600 bg-purple-50 dark:bg-purple-950'
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
  }
}

export function calculateNPS(ratings: number[]) {
  if (ratings.length === 0) return 0
  
  const promoters = ratings.filter(rating => rating >= 9).length
  const detractors = ratings.filter(rating => rating <= 6).length
  const total = ratings.length
  
  return Math.round(((promoters - detractors) / total) * 100)
}

export function calculateCSAT(ratings: number[]) {
  if (ratings.length === 0) return 0
  
  const satisfied = ratings.filter(rating => rating >= 4).length
  const total = ratings.length
  
  return Math.round((satisfied / total) * 100)
}