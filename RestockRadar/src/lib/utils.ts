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
  }).format(amount)
}

export function formatNumber(
  number: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(number)
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date))
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getStockStatus(
  currentStock: number,
  reorderPoint: number,
  maxStock: number
): 'low' | 'good' | 'high' | 'out' {
  if (currentStock === 0) return 'out'
  if (currentStock <= reorderPoint) return 'low'
  if (currentStock >= maxStock * 0.9) return 'high'
  return 'good'
}

export function calculateReorderQuantity(
  currentStock: number,
  reorderPoint: number,
  maxStock: number,
  averageDemand: number,
  leadTimeDays: number
): number {
  const safetyStock = Math.ceil(averageDemand * 0.2) // 20% safety buffer
  const leadTimeStock = Math.ceil(averageDemand * (leadTimeDays / 30))
  const totalNeeded = leadTimeStock + safetyStock
  
  return Math.max(totalNeeded - currentStock, 0)
}

export function getPriorityColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
  switch (priority) {
    case 'low': return 'text-green-600 bg-green-100'
    case 'medium': return 'text-yellow-600 bg-yellow-100'
    case 'high': return 'text-orange-600 bg-orange-100'
    case 'urgent': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}