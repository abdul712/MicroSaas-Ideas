import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate secure random strings
export function generateSecureId(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate slug from string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const now = new Date()
  const target = new Date(date)
  const diffInMs = target.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60))
    if (Math.abs(diffInHours) < 1) {
      const diffInMinutes = Math.ceil(diffInMs / (1000 * 60))
      return rtf.format(diffInMinutes, 'minute')
    }
    return rtf.format(diffInHours, 'hour')
  }
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day')
  }
  if (Math.abs(diffInDays) < 365) {
    const diffInMonths = Math.ceil(diffInDays / 30)
    return rtf.format(diffInMonths, 'month')
  }
  const diffInYears = Math.ceil(diffInDays / 365)
  return rtf.format(diffInYears, 'year')
}

// Truncate text
export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Calculate NPS score
export function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0
  
  const promoters = scores.filter(score => score >= 9).length
  const detractors = scores.filter(score => score <= 6).length
  const total = scores.length
  
  return Math.round(((promoters - detractors) / total) * 100)
}

// Calculate CSAT score
export function calculateCSAT(scores: number[], maxScore: number = 5): number {
  if (scores.length === 0) return 0
  
  const satisfiedThreshold = maxScore >= 5 ? 4 : Math.ceil(maxScore * 0.8)
  const satisfied = scores.filter(score => score >= satisfiedThreshold).length
  
  return Math.round((satisfied / scores.length) * 100)
}

// Calculate average
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Generate embed code for widgets
export function generateEmbedCode(widgetId: string, type: string = 'popup'): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  switch (type) {
    case 'popup':
      return `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widgets/${widgetId}/popup.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`
    
    case 'inline':
      return `<div id="feedback-widget-${widgetId}"></div>
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widgets/${widgetId}/inline.js';
  script.async = true;
  script.onload = function() {
    window.FeedbackWidget.render('feedback-widget-${widgetId}');
  };
  document.head.appendChild(script);
})();
</script>`
    
    case 'slide-in':
      return `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widgets/${widgetId}/slide-in.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`
    
    default:
      return `<script src="${baseUrl}/widgets/${widgetId}/embed.js" async></script>`
  }
}

// Color utilities
export const colors = {
  primary: 'hsl(221.2 83.2% 53.3%)',
  secondary: 'hsl(210 40% 95%)',
  success: 'hsl(142.1 76.2% 36.3%)',
  warning: 'hsl(47.9 95.8% 53.1%)',
  error: 'hsl(0 84.2% 60.2%)',
  muted: 'hsl(210 40% 92%)',
}

// File size formatter
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Percentage formatter
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Number formatter
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// Currency formatter
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Stripe amounts are in cents
}

// Debounce function
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

// Throttle function
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}