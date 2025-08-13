import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Email analytics utility functions
export function calculateEmailMetrics(metrics: {
  totalSent: number
  totalDelivered: number
  uniqueOpens: number
  uniqueClicks: number
  unsubscribes: number
  spamReports: number
  bounces: number
}) {
  const {
    totalSent,
    totalDelivered,
    uniqueOpens,
    uniqueClicks,
    unsubscribes,
    spamReports,
    bounces
  } = metrics

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const openRate = totalDelivered > 0 ? (uniqueOpens / totalDelivered) * 100 : 0
  const clickRate = totalDelivered > 0 ? (uniqueClicks / totalDelivered) * 100 : 0
  const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0
  const unsubscribeRate = totalDelivered > 0 ? (unsubscribes / totalDelivered) * 100 : 0
  const spamRate = totalDelivered > 0 ? (spamReports / totalDelivered) * 100 : 0
  const bounceRate = totalSent > 0 ? (bounces / totalSent) * 100 : 0

  return {
    deliveryRate: Number(deliveryRate.toFixed(2)),
    openRate: Number(openRate.toFixed(2)),
    clickRate: Number(clickRate.toFixed(2)),
    clickToOpenRate: Number(clickToOpenRate.toFixed(2)),
    unsubscribeRate: Number(unsubscribeRate.toFixed(4)),
    spamRate: Number(spamRate.toFixed(4)),
    bounceRate: Number(bounceRate.toFixed(2))
  }
}

// Engagement scoring algorithm
export function calculateEngagementScore(metrics: {
  openRate: number
  clickRate: number
  unsubscribeRate: number
  spamRate: number
  bounceRate: number
  listGrowthRate?: number
}) {
  const {
    openRate,
    clickRate,
    unsubscribeRate,
    spamRate,
    bounceRate,
    listGrowthRate = 0
  } = metrics

  // Base score from positive engagement
  let score = 0
  score += Math.min(openRate * 2, 50) // Open rate worth up to 50 points
  score += Math.min(clickRate * 5, 30) // Click rate worth up to 30 points
  score += Math.min(listGrowthRate * 3, 20) // Growth rate worth up to 20 points

  // Deduct points for negative engagement
  score -= unsubscribeRate * 10 // Heavy penalty for unsubscribes
  score -= spamRate * 20 // Very heavy penalty for spam
  score -= Math.min(bounceRate * 2, 15) // Penalty for bounces

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Format numbers for display
export function formatNumber(num: number, decimals: number = 0): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K'
  }
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })
}

// Format percentage
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Date formatting utilities
export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return d.toLocaleDateString()
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return d.toLocaleDateString()
}

// Campaign status utilities
export function getCampaignStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'sent':
      return 'success'
    case 'sending':
      return 'info'
    case 'scheduled':
      return 'warning'
    case 'draft':
      return 'neutral'
    case 'paused':
    case 'cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

// Performance indicators
export function getPerformanceIndicator(value: number, benchmarks: {
  excellent: number
  good: number
  average: number
}): {
  level: 'excellent' | 'good' | 'average' | 'poor'
  color: 'success' | 'info' | 'warning' | 'error'
} {
  if (value >= benchmarks.excellent) {
    return { level: 'excellent', color: 'success' }
  }
  if (value >= benchmarks.good) {
    return { level: 'good', color: 'info' }
  }
  if (value >= benchmarks.average) {
    return { level: 'average', color: 'warning' }
  }
  return { level: 'poor', color: 'error' }
}

// Email provider utilities
export function getProviderLogo(provider: string): string {
  const logos: Record<string, string> = {
    mailchimp: '/logos/mailchimp.svg',
    sendgrid: '/logos/sendgrid.svg',
    klaviyo: '/logos/klaviyo.svg',
    convertkit: '/logos/convertkit.svg',
    activecampaign: '/logos/activecampaign.svg',
    constantcontact: '/logos/constantcontact.svg',
    hubspot: '/logos/hubspot.svg',
    mailgun: '/logos/mailgun.svg',
    sendinblue: '/logos/sendinblue.svg'
  }
  return logos[provider.toLowerCase()] || '/logos/default.svg'
}

// Data validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Chart color palette
export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  neutral: '#6B7280'
}

// Generate color palette for charts
export function generateChartColors(count: number): string[] {
  const baseColors = Object.values(chartColors)
  const colors: string[] = []
  
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length])
  }
  
  return colors
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Local storage utilities with error handling
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently fail
  }
}