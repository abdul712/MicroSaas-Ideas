import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Format with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phoneNumber
}

export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function calculateCallQuality(metrics: {
  latency?: number
  jitter?: number
  packetLoss?: number
}): 'excellent' | 'good' | 'fair' | 'poor' {
  const { latency = 0, jitter = 0, packetLoss = 0 } = metrics
  
  let score = 100
  
  // Penalize high latency (>150ms is poor)
  if (latency > 150) score -= 30
  else if (latency > 100) score -= 15
  else if (latency > 50) score -= 5
  
  // Penalize jitter (>30ms is poor)
  if (jitter > 30) score -= 25
  else if (jitter > 15) score -= 10
  else if (jitter > 5) score -= 3
  
  // Penalize packet loss (>3% is poor)
  if (packetLoss > 3) score -= 35
  else if (packetLoss > 1) score -= 15
  else if (packetLoss > 0.5) score -= 5
  
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

export function validateExtensionNumber(number: string): boolean {
  // Extension numbers should be 3-6 digits
  return /^\d{3,6}$/.test(number)
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

export function getCallStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'missed':
      return 'text-red-600'
    case 'busy':
      return 'text-yellow-600'
    case 'failed':
      return 'text-red-600'
    case 'ongoing':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}

export function getPresenceStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-red-500'
    case 'away':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}