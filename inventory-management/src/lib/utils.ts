import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function calculateStockStatus(current: number, reorderPoint: number) {
  if (current === 0) return 'out-of-stock'
  if (current <= reorderPoint) return 'low-stock'
  return 'in-stock'
}

export function getStockStatusColor(status: string) {
  switch (status) {
    case 'out-of-stock':
      return 'text-red-600 bg-red-50'
    case 'low-stock':
      return 'text-yellow-600 bg-yellow-50'
    case 'in-stock':
      return 'text-green-600 bg-green-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function generateSKU(prefix = 'SKU') {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function calculateInventoryValue(inventory: Array<{ quantity: number; cost: number }>) {
  return inventory.reduce((total, item) => total + (item.quantity * item.cost), 0)
}

export function calculateTurnoverRate(soldQuantity: number, averageInventory: number) {
  if (averageInventory === 0) return 0
  return soldQuantity / averageInventory
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}