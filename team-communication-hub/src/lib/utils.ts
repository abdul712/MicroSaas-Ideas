import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatMessageTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(parsedDate)) {
    return format(parsedDate, 'HH:mm');
  } else if (isYesterday(parsedDate)) {
    return `Yesterday ${format(parsedDate, 'HH:mm')}`;
  } else {
    return format(parsedDate, 'MMM d, HH:mm');
  }
}

export function formatRelativeTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

export function highlightMentions(text: string, currentUserId?: string): string {
  return text.replace(/@(\w+)/g, (match, username) => {
    const isCurrentUser = username === currentUserId;
    const className = isCurrentUser 
      ? 'bg-blue-100 text-blue-800 font-medium px-1 rounded'
      : 'bg-gray-100 text-gray-800 font-medium px-1 rounded';
    return `<span class="${className}">${match}</span>`;
  });
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string): boolean {
  // Username: 3-20 characters, alphanumeric + underscore, no spaces
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function isValidSubdomain(subdomain: string): boolean {
  // Subdomain: 3-20 characters, lowercase alphanumeric + hyphens
  const subdomainRegex = /^[a-z0-9-]{3,20}$/;
  return subdomainRegex.test(subdomain);
}

export function isValidChannelName(name: string): boolean {
  // Channel name: 1-20 characters, lowercase alphanumeric + hyphens + underscores
  const channelNameRegex = /^[a-z0-9-_]{1,20}$/;
  return channelNameRegex.test(name);
}

// URL utilities
export function generateAvatarUrl(userId: string, size: number = 40): string {
  // Generate deterministic avatar URL using user ID
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&size=${size}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
  return '📎';
}

// Security utilities
export function sanitizeMessage(content: string): string {
  // Basic XSS protection - escape HTML
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function generateInviteToken(): string {
  // Generate secure random token for invitations
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Rate limiting utilities
export function createRateLimiter(requests: number, windowMs: number) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const current = requestCounts.get(identifier);
    
    if (!current || now > current.resetTime) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= requests) {
      return false;
    }
    
    current.count++;
    return true;
  };
}

// Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Storage utilities
export function setLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    (error.message.includes('fetch') || 
     error.message.includes('network') ||
     error.message.includes('NetworkError'));
}

// Emoji utilities
export const commonEmojis = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '✅', '❌'
];

export function isValidEmoji(emoji: string): boolean {
  // Basic emoji validation - check if it's a single emoji character
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
  return emojiRegex.test(emoji);
}

// Search utilities
export function createSearchIndex(items: any[], fields: string[]): Map<string, any[]> {
  const index = new Map<string, any[]>();
  
  items.forEach(item => {
    fields.forEach(field => {
      const value = item[field];
      if (typeof value === 'string') {
        const words = value.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) {
            const existing = index.get(word) || [];
            existing.push(item);
            index.set(word, existing);
          }
        });
      }
    });
  });
  
  return index;
}

export function searchItems<T>(
  items: T[],
  query: string,
  fields: string[]
): T[] {
  if (!query.trim()) return items;
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return items.filter(item => {
    return searchTerms.every(term => {
      return fields.some(field => {
        const value = (item as any)[field];
        return typeof value === 'string' && 
               value.toLowerCase().includes(term);
      });
    });
  });
}