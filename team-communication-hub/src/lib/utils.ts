import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  
  if (messageDate.getTime() === today.getTime()) {
    return formatTime(d)
  } else if (messageDate.getTime() === today.getTime() - 86400000) {
    return `Yesterday ${formatTime(d)}`
  } else {
    return `${formatDate(d)} ${formatTime(d)}`
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
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
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000) // Limit length
}

export function generateAvatarUrl(name: string): string {
  const initial = name.charAt(0).toUpperCase()
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500'
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${colors[colorIndex].replace('bg-', '#')}" rx="20"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="16" font-weight="bold">
        ${initial}
      </text>
    </svg>
  `)}`
}