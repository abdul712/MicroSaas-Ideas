import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance, formatRelative, isToday, isYesterday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr)
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  
  if (isToday(dateObj)) {
    return format(dateObj, 'h:mm a')
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }
  
  if (Math.abs(now.getTime() - dateObj.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    return formatRelative(dateObj, now)
  }
  
  return format(dateObj, 'MMM d, yyyy')
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  
  return `${minutes}m`
}

// Task and project utilities
export function getTaskStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'todo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100'
    case 'review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-100'
    case 'blocked':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100'
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800'
    case 'medium':
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800'
    case 'low':
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/50 dark:border-gray-800'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/50 dark:border-gray-800'
  }
}

export function getPriorityIcon(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return '🔴'
    case 'high':
      return '🟠'
    case 'medium':
      return '🔵'
    case 'low':
      return '⚪'
    default:
      return '⚪'
  }
}

// User and team utilities
export function getUserInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(userId: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ]
  
  // Simple hash function to consistently assign color based on userId
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Performance and analytics utilities
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function getHealthScore(score: number): {
  label: string
  color: string
  description: string
} {
  if (score >= 0.9) {
    return {
      label: 'Excellent',
      color: 'text-green-600 dark:text-green-400',
      description: 'Team is performing exceptionally well'
    }
  } else if (score >= 0.7) {
    return {
      label: 'Good',
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Team is performing well with room for improvement'
    }
  } else if (score >= 0.5) {
    return {
      label: 'Fair',
      color: 'text-yellow-600 dark:text-yellow-400',
      description: 'Team performance needs attention'
    }
  } else {
    return {
      label: 'Poor',
      color: 'text-red-600 dark:text-red-400',
      description: 'Team requires immediate attention'
    }
  }
}

// Workload and capacity utilities
export function getWorkloadLevel(current: number, capacity: number): {
  level: 'low' | 'optimal' | 'high' | 'critical'
  percentage: number
  color: string
} {
  const percentage = (current / capacity) * 100
  
  if (percentage <= 50) {
    return { level: 'low', percentage, color: 'text-green-600 bg-green-50' }
  } else if (percentage <= 80) {
    return { level: 'optimal', percentage, color: 'text-blue-600 bg-blue-50' }
  } else if (percentage <= 100) {
    return { level: 'high', percentage, color: 'text-orange-600 bg-orange-50' }
  } else {
    return { level: 'critical', percentage, color: 'text-red-600 bg-red-50' }
  }
}

export function getCognitiveLoadColor(load: number): string {
  if (load <= 0.3) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (load <= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (load <= 0.8) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

// AI and insights utilities
export function getConfidenceLevel(score: number): {
  label: string
  color: string
} {
  if (score >= 0.9) {
    return { label: 'Very High', color: 'text-green-600' }
  } else if (score >= 0.7) {
    return { label: 'High', color: 'text-blue-600' }
  } else if (score >= 0.5) {
    return { label: 'Medium', color: 'text-yellow-600' }
  } else {
    return { label: 'Low', color: 'text-red-600' }
  }
}

export function getRiskLevel(score: number): {
  label: string
  color: string
  icon: string
} {
  if (score <= 0.3) {
    return { label: 'Low Risk', color: 'text-green-600', icon: '✅' }
  } else if (score <= 0.6) {
    return { label: 'Medium Risk', color: 'text-yellow-600', icon: '⚠️' }
  } else if (score <= 0.8) {
    return { label: 'High Risk', color: 'text-orange-600', icon: '🔸' }
  } else {
    return { label: 'Critical Risk', color: 'text-red-600', icon: '🚨' }
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return strongPasswordRegex.test(password)
}

// URL and slug utilities
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

// Number formatting utilities
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Debounce utility
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

// Theme utilities
export function getThemeColor(theme: 'light' | 'dark' | 'system' = 'system'): string {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unknown error occurred'
}

// Local storage utilities with error handling
export function safeLocalStorage() {
  return {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value)
      } catch {
        // Silently fail
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Silently fail
      }
    },
  }
}

// Feature flag utilities
export function isFeatureEnabled(feature: string): boolean {
  const enabledFeatures = process.env.NEXT_PUBLIC_ENABLED_FEATURES?.split(',') || []
  return enabledFeatures.includes(feature) || process.env.NODE_ENV === 'development'
}