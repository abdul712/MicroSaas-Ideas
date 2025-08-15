import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTrackingId(): string {
  return 'hm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function calculateHeatmapIntensity(count: number, maxCount: number): number {
  if (maxCount === 0) return 0
  return Math.min(1, count / maxCount)
}

export function getHeatmapColor(intensity: number): string {
  // Blue to red gradient
  const colors = [
    'rgba(0, 0, 255, 0.1)',   // Very low intensity - transparent blue
    'rgba(0, 255, 255, 0.3)', // Low intensity - cyan
    'rgba(0, 255, 0, 0.5)',   // Medium intensity - green
    'rgba(255, 255, 0, 0.7)', // High intensity - yellow
    'rgba(255, 0, 0, 0.9)',   // Very high intensity - red
  ]
  
  const index = Math.floor(intensity * (colors.length - 1))
  return colors[Math.min(index, colors.length - 1)]
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

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeElementSelector(element: Element): string {
  // Create a safe selector for the element
  let selector = element.tagName.toLowerCase()
  
  if (element.id) {
    selector += `#${element.id}`
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean).slice(0, 3)
    selector += '.' + classes.join('.')
  }
  
  return selector
}

export function getElementPath(element: Element): string {
  const path = []
  let current = element
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    
    if (current.id) {
      selector += `#${current.id}`
      path.unshift(selector)
      break
    }
    
    if (current.className) {
      const classes = current.className.split(' ').filter(Boolean).slice(0, 2)
      if (classes.length > 0) {
        selector += '.' + classes.join('.')
      }
    }
    
    path.unshift(selector)
    current = current.parentElement as Element
  }
  
  return path.join(' > ')
}

export function compressSessionData(data: any): string {
  // Simple compression for session data
  return JSON.stringify(data)
}

export function decompressSessionData(data: string): any {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}