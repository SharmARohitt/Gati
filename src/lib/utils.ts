import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format large numbers with Indian numbering system
export function formatIndianNumber(num: number): string {
  const str = num.toString()
  let lastThree = str.substring(str.length - 3)
  const otherNumbers = str.substring(0, str.length - 3)
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree
}

// Format number with K/M/B suffix
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Format percentage with precision
export function formatPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format datetime for display
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate random ID for demo purposes
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Truncate text with ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Get severity color class
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    high: 'text-red-600 bg-red-50 border-red-200',
    critical: 'text-purple-600 bg-purple-50 border-purple-200'
  }
  return colors[severity]
}

// Get status color class
export function getStatusColor(status: 'active' | 'pending' | 'resolved' | 'assigned'): string {
  const colors = {
    active: 'text-emerald-600',
    pending: 'text-amber-600',
    resolved: 'text-blue-600',
    assigned: 'text-purple-600'
  }
  return colors[status]
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(change),
    isPositive: change >= 0
  }
}

// Delay utility for animations
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate hash for blockchain display
export function generateHash(): string {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}
