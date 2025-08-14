import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr = "PPP"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return "Invalid date";
  }
  
  return format(dateObj, formatStr);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function calculateShiftDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;
  
  // Handle overnight shifts
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }
  
  return (endTotalMinutes - startTotalMinutes) / 60;
}

export function calculateLaborCost(
  hourlyRate: number,
  hoursWorked: number,
  overtimeThreshold = 8,
  overtimeMultiplier = 1.5
): number {
  if (hoursWorked <= overtimeThreshold) {
    return hourlyRate * hoursWorked;
  }
  
  const regularHours = overtimeThreshold;
  const overtimeHours = hoursWorked - overtimeThreshold;
  
  return (
    regularHours * hourlyRate +
    overtimeHours * hourlyRate * overtimeMultiplier
  );
}

export function generateShiftColor(role?: string): string {
  if (!role) return "#6B7280"; // gray-500
  
  const colors = {
    manager: "#DC2626", // red-600
    supervisor: "#EA580C", // orange-600  
    server: "#059669", // emerald-600
    cook: "#7C3AED", // violet-600
    host: "#0284C7", // sky-600
    bartender: "#DB2777", // pink-600
    cleaner: "#65A30D", // lime-600
    cashier: "#0891B2", // cyan-600
  };
  
  const roleKey = role.toLowerCase() as keyof typeof colors;
  return colors[roleKey] || "#6B7280";
}

export function getShiftTimeCategory(startTime: string): string {
  const [hours] = startTime.split(":").map(Number);
  
  if (hours >= 5 && hours < 12) return "morning";
  if (hours >= 12 && hours < 17) return "afternoon"; 
  if (hours >= 17 && hours < 22) return "evening";
  return "night";
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function generateEmployeeId(): string {
  const prefix = "EMP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  
  return `${prefix}${timestamp}${random}`;
}

export function calculateAvailabilityScore(
  availableHours: number,
  requiredHours: number
): "high" | "medium" | "low" {
  const ratio = availableHours / requiredHours;
  
  if (ratio >= 1.2) return "high";
  if (ratio >= 0.8) return "medium";
  return "low";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
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