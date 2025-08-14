import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatTime(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidUrl(string: string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function capitalizeFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
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

export function getPlatformColor(platform: string) {
  const colors = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    linkedin: "#0077B5",
    tiktok: "#000000",
    youtube: "#FF0000",
    pinterest: "#BD081C",
    snapchat: "#FFFC00",
  }
  return colors[platform.toLowerCase() as keyof typeof colors] || "#6B7280"
}

export function getStatusColor(status: string) {
  const colors = {
    draft: "#6B7280",
    "in-review": "#F59E0B",
    approved: "#10B981",
    scheduled: "#3B82F6",
    published: "#059669",
    failed: "#EF4444",
    archived: "#9CA3AF",
  }
  return colors[status.toLowerCase() as keyof typeof colors] || "#6B7280"
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day
  return new Date(result.setDate(diff))
}

export function endOfWeek(date: Date) {
  const result = startOfWeek(date)
  return addDays(result, 6)
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function isToday(date: Date) {
  return isSameDay(date, new Date())
}

export function isPast(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate < today
}

export function isFuture(date: Date) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

export function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function getWeeksInMonth(date: Date) {
  const firstDay = startOfMonth(date)
  const lastDay = endOfMonth(date)
  const firstWeek = startOfWeek(firstDay)
  const lastWeek = endOfWeek(lastDay)
  return Math.ceil((lastWeek.getTime() - firstWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
}

export function getCalendarDays(date: Date) {
  const firstDay = startOfMonth(date)
  const lastDay = endOfMonth(date)
  const firstWeek = startOfWeek(firstDay)
  const lastWeek = endOfWeek(lastDay)
  
  const days = []
  const current = new Date(firstWeek)
  
  while (current <= lastWeek) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}