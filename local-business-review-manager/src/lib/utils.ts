import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Platform, Sentiment } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date utilities
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return count === 1 
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return "Just now";
}

// Rating utilities
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "text-green-500";
  if (rating >= 4) return "text-lime-500";
  if (rating >= 3) return "text-yellow-500";
  if (rating >= 2) return "text-orange-500";
  return "text-red-500";
}

export function getRatingBgColor(rating: number): string {
  if (rating >= 4.5) return "bg-green-100 text-green-800";
  if (rating >= 4) return "bg-lime-100 text-lime-800";
  if (rating >= 3) return "bg-yellow-100 text-yellow-800";
  if (rating >= 2) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

export function getStarIcons(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let stars = "★".repeat(fullStars);
  
  if (hasHalfStar) {
    stars += "☆";
  }
  
  const emptyStars = 5 - Math.ceil(rating);
  stars += "☆".repeat(emptyStars);
  
  return stars;
}

// Platform utilities
export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case Platform.GOOGLE_MY_BUSINESS:
      return "text-google";
    case Platform.FACEBOOK:
      return "text-facebook";
    case Platform.YELP:
      return "text-yelp";
    case Platform.TRIPADVISOR:
      return "text-tripadvisor";
    default:
      return "text-gray-500";
  }
}

export function getPlatformBgColor(platform: Platform): string {
  switch (platform) {
    case Platform.GOOGLE_MY_BUSINESS:
      return "bg-google text-google-foreground";
    case Platform.FACEBOOK:
      return "bg-facebook text-facebook-foreground";
    case Platform.YELP:
      return "bg-yelp text-yelp-foreground";
    case Platform.TRIPADVISOR:
      return "bg-tripadvisor text-tripadvisor-foreground";
    default:
      return "bg-gray-500 text-white";
  }
}

export function getPlatformName(platform: Platform): string {
  switch (platform) {
    case Platform.GOOGLE_MY_BUSINESS:
      return "Google My Business";
    case Platform.FACEBOOK:
      return "Facebook";
    case Platform.YELP:
      return "Yelp";
    case Platform.TRIPADVISOR:
      return "TripAdvisor";
    case Platform.TRUSTPILOT:
      return "Trustpilot";
    default:
      return platform;
  }
}

// Sentiment utilities
export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case Sentiment.POSITIVE:
      return "text-sentiment-positive";
    case Sentiment.NEGATIVE:
      return "text-sentiment-negative";
    case Sentiment.NEUTRAL:
      return "text-sentiment-neutral";
    default:
      return "text-gray-500";
  }
}

export function getSentimentBgColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case Sentiment.POSITIVE:
      return "bg-green-100 text-green-800";
    case Sentiment.NEGATIVE:
      return "bg-red-100 text-red-800";
    case Sentiment.NEUTRAL:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getSentimentIcon(sentiment: Sentiment): string {
  switch (sentiment) {
    case Sentiment.POSITIVE:
      return "😊";
    case Sentiment.NEGATIVE:
      return "😞";
    case Sentiment.NEUTRAL:
      return "😐";
    default:
      return "❓";
  }
}

// Text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

// Number utilities
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Color utilities for charts
export const chartColors = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",
};

export function getRandomColor(): string {
  const colors = Object.values(chartColors);
  return colors[Math.floor(Math.random() * colors.length)];
}

// Security utilities
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization (in production, use a proper library like DOMPurify)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}