import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat("en-US").format(number)
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function truncateString(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = new Date().getTime()
    if (now - lastCall < delay) {
      return
    }
    lastCall = now
    return func(...args)
  }
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function parseEmailVariables(content: string, variables: Record<string, any>) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function extractEmailVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return matches.map(match => match.replace(/[{}]/g, ''))
}

export function calculateEmailMetrics(sends: any[]) {
  const total = sends.length
  const delivered = sends.filter(s => s.deliveredAt).length
  const opened = sends.filter(s => s.openedAt).length
  const clicked = sends.filter(s => s.clickedAt).length
  const replied = sends.filter(s => s.repliedAt).length
  const bounced = sends.filter(s => s.bouncedAt).length
  const unsubscribed = sends.filter(s => s.unsubscribedAt).length

  return {
    total,
    deliveredRate: total > 0 ? (delivered / total) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    replyRate: delivered > 0 ? (replied / delivered) * 100 : 0,
    bounceRate: total > 0 ? (bounced / total) * 100 : 0,
    unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
  }
}