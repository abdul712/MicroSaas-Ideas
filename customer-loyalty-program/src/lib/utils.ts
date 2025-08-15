import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-US').format(points)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function calculateTierFromPoints(points: number, tiers: any[]): string | null {
  if (!tiers.length) return null
  
  const sortedTiers = tiers.sort((a, b) => b.threshold - a.threshold)
  
  for (const tier of sortedTiers) {
    if (points >= tier.threshold) {
      return tier.name
    }
  }
  
  return null
}

export function getTierColor(tierName: string | null): string {
  if (!tierName) return '#6B7280' // gray
  
  const tier = tierName.toLowerCase()
  
  if (tier.includes('bronze')) return '#CD7F32'
  if (tier.includes('silver')) return '#C0C0C0'
  if (tier.includes('gold')) return '#FFD700'
  if (tier.includes('platinum')) return '#E5E4E2'
  if (tier.includes('diamond')) return '#B9F2FF'
  
  return '#6B7280'
}

export function calculatePointsToNextTier(currentPoints: number, tiers: any[]): number {
  if (!tiers.length) return 0
  
  const sortedTiers = tiers.sort((a, b) => a.threshold - b.threshold)
  
  for (const tier of sortedTiers) {
    if (currentPoints < tier.threshold) {
      return tier.threshold - currentPoints
    }
  }
  
  return 0 // Already at highest tier
}

export function generateMemberNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `LM${timestamp}${random}`.toUpperCase()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  
  const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 10 && cleaned.length !== 11) return phone
  
  const lastFour = cleaned.slice(-4)
  const masked = '*'.repeat(cleaned.length - 4) + lastFour
  return masked
}

export function calculateRedemptionValue(points: number, pointValue: number): number {
  return points * pointValue
}

export function isRewardExpired(validUntil: Date | null): boolean {
  if (!validUntil) return false
  return new Date() > validUntil
}

export function isRewardAvailable(
  reward: any,
  totalRedeemed: number = 0
): boolean {
  if (!reward.isActive) return false
  if (isRewardExpired(reward.validUntil)) return false
  if (reward.maxRedemptions && totalRedeemed >= reward.maxRedemptions) return false
  
  const now = new Date()
  if (reward.validFrom && now < reward.validFrom) return false
  
  return true
}

export function generateQRCodeData(businessId: string, customerId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const data = {
    businessId,
    customerId,
    timestamp: Date.now(),
  }
  
  return `${baseUrl}/scan?data=${btoa(JSON.stringify(data))}`
}

export function parseQRCodeData(data: string): any {
  try {
    const decoded = atob(data)
    return JSON.parse(decoded)
  } catch {
    return null
  }
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
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}