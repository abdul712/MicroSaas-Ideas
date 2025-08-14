import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

export function generateMeetingId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function extractActionItems(text: string): string[] {
  // Simple regex to extract action items - in production, this would use AI
  const actionItemRegex = /(?:action item|todo|task|follow up|next step)[:\s]+(.*?)(?:\n|$)/gi
  const matches = text.match(actionItemRegex) || []
  return matches.map(match => match.replace(/(?:action item|todo|task|follow up|next step)[:\s]+/i, '').trim())
}

export function extractDecisions(text: string): string[] {
  // Simple regex to extract decisions - in production, this would use AI
  const decisionRegex = /(?:decided|decision|agreed|conclude)[:\s]+(.*?)(?:\n|$)/gi
  const matches = text.match(decisionRegex) || []
  return matches.map(match => match.replace(/(?:decided|decision|agreed|conclude)[:\s]+/i, '').trim())
}

export function summarizeText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text
  
  // Simple summarization - in production, this would use AI
  const sentences = text.split('. ')
  let summary = ''
  
  for (const sentence of sentences) {
    if ((summary + sentence).length <= maxLength - 3) {
      summary += sentence + '. '
    } else {
      break
    }
  }
  
  return summary.trim() + (summary.length < text.length ? '...' : '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateColor(seed: string): string {
  // Generate consistent color from string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}