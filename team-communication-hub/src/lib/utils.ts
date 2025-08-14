import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday, isThisYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatMessageTime(date: Date | string) {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, "HH:mm");
  } else if (isYesterday(messageDate)) {
    return `Yesterday ${format(messageDate, "HH:mm")}`;
  } else if (isThisYear(messageDate)) {
    return format(messageDate, "MMM d, HH:mm");
  } else {
    return format(messageDate, "MMM d, yyyy HH:mm");
  }
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatMessageDate(date: Date | string) {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return "Today";
  } else if (isYesterday(messageDate)) {
    return "Yesterday";
  } else if (isThisYear(messageDate)) {
    return format(messageDate, "MMMM d");
  } else {
    return format(messageDate, "MMMM d, yyyy");
  }
}

// Text utilities
export function truncateText(text: string, length: number = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "...";
}

export function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateUsername(email: string) {
  const username = email.split("@")[0];
  return generateSlug(username);
}

// File utilities
export function formatFileSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
}

export function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(filename: string) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  return imageExtensions.includes(getFileExtension(filename));
}

export function isVideoFile(filename: string) {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
  return videoExtensions.includes(getFileExtension(filename));
}

export function isAudioFile(filename: string) {
  const audioExtensions = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
  return audioExtensions.includes(getFileExtension(filename));
}

export function getFileIcon(filename: string) {
  const extension = getFileExtension(filename);
  
  if (isImageFile(filename)) return "🖼️";
  if (isVideoFile(filename)) return "🎥";
  if (isAudioFile(filename)) return "🎵";
  
  switch (extension) {
    case "pdf": return "📄";
    case "doc":
    case "docx": return "📝";
    case "xls":
    case "xlsx": return "📊";
    case "ppt":
    case "pptx": return "📋";
    case "zip":
    case "rar":
    case "7z": return "🗜️";
    case "txt": return "📃";
    case "js":
    case "ts":
    case "jsx":
    case "tsx": return "⚡";
    case "html": return "🌐";
    case "css": return "🎨";
    case "json": return "📋";
    default: return "📎";
  }
}

// Validation utilities
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

export function isValidTeamSlug(slug: string) {
  const slugRegex = /^[a-z0-9-]{3,30}$/;
  return slugRegex.test(slug);
}

// Color utilities
export function getAvatarColor(text: string) {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-teal-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// URL utilities
export function createTeamUrl(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/workspace/${slug}`;
}

export function createInviteUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/invite/${token}`;
}

// Search utilities
export function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

export function fuzzySearch(query: string, text: string) {
  const pattern = query
    .split("")
    .map(char => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  
  const regex = new RegExp(pattern, "i");
  return regex.test(text);
}

// Mention utilities
export function extractMentions(text: string) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      index: match.index,
      length: match[0].length,
    });
  }
  
  return mentions;
}

export function replaceMentions(text: string, userMap: Record<string, { id: string; name: string }>) {
  return text.replace(/@(\w+)/g, (match, username) => {
    const user = userMap[username];
    if (user) {
      return `<span class="mention" data-user-id="${user.id}">@${user.name}</span>`;
    }
    return match;
  });
}

// Encryption utilities (for client-side operations)
export async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Random utilities
export function generateId(length: number = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

// Performance utilities
export function measurePerformance<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (label) {
    console.log(`${label} took ${end - start} milliseconds`);
  }
  
  return result;
}

// Error utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return "An unknown error occurred";
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === "Failed to fetch";
}

// Local storage utilities
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error("Failed to set localStorage:", error);
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== "undefined") {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error("Failed to get localStorage:", error);
    return defaultValue;
  }
}

export function removeLocalStorage(key: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Failed to remove localStorage:", error);
  }
}