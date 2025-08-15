import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export function formatPercentage(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateEngagementScore(
  opens: number,
  clicks: number,
  replies: number,
  totalEmails: number
) {
  if (totalEmails === 0) return 0
  
  const openWeight = 0.3
  const clickWeight = 0.4
  const replyWeight = 0.3
  
  const openRate = opens / totalEmails
  const clickRate = clicks / totalEmails
  const replyRate = replies / totalEmails
  
  return Math.round(
    (openRate * openWeight + clickRate * clickWeight + replyRate * replyWeight) * 100
  )
}

export function getTimeZoneOffset(timeZone: string) {
  const now = new Date()
  const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
  const targetDate = new Date(utcDate.toLocaleString("en-US", { timeZone }))
  return targetDate.getTime() - utcDate.getTime()
}

export function parseCustomFields(customFields: any) {
  try {
    return typeof customFields === "string" 
      ? JSON.parse(customFields) 
      : customFields || {}
  } catch {
    return {}
  }
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

export function getEmailProvider(email: string) {
  const domain = email.split("@")[1]
  const providers = {
    "gmail.com": "Gmail",
    "yahoo.com": "Yahoo",
    "outlook.com": "Outlook",
    "hotmail.com": "Hotmail",
    "icloud.com": "iCloud",
  }
  return providers[domain as keyof typeof providers] || "Other"
}

export function calculateDeliveryTime(
  delayDays: number,
  delayHours: number,
  fromDate: Date = new Date()
) {
  const deliveryTime = new Date(fromDate)
  deliveryTime.setDate(deliveryTime.getDate() + delayDays)
  deliveryTime.setHours(deliveryTime.getHours() + delayHours)
  return deliveryTime
}

export function isBusinessHours(date: Date, timeZone = "UTC") {
  const localDate = new Date(date.toLocaleString("en-US", { timeZone }))
  const hour = localDate.getHours()
  const day = localDate.getDay()
  
  // Monday = 1, Friday = 5
  const isWeekday = day >= 1 && day <= 5
  const isBusinessHour = hour >= 9 && hour <= 17
  
  return isWeekday && isBusinessHour
}

export function generateUnsubscribeToken() {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString("base64url")
}

export function parseUnsubscribeToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString()
    const [timestamp, random] = decoded.split("-")
    return { timestamp: parseInt(timestamp), random }
  } catch {
    return null
  }
}