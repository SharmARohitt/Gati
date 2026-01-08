/**
 * GATI i18n Client Utilities
 * Client-side internationalization helpers
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { locales, localeNames, defaultLocale, Locale, isRTL } from './config'

// ============================================
// Locale Storage
// ============================================

const LOCALE_STORAGE_KEY = 'gati-locale'

/**
 * Get stored locale from localStorage
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale
    }
  } catch {
    // localStorage not available
  }
  return null
}

/**
 * Store locale to localStorage
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // localStorage not available
  }
}

// ============================================
// Locale Hook
// ============================================

interface UseLocaleReturn {
  locale: Locale
  setLocale: (locale: Locale) => void
  locales: readonly Locale[]
  localeNames: Record<Locale, string>
  isRTL: boolean
}

/**
 * Hook for managing locale
 */
export function useLocale(): UseLocaleReturn {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Load stored locale on mount
  useEffect(() => {
    const stored = getStoredLocale()
    if (stored) {
      setLocaleState(stored)
    } else {
      // Try to detect from browser
      const browserLocale = navigator.language.split('-')[0] as Locale
      if (locales.includes(browserLocale)) {
        setLocaleState(browserLocale)
      }
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setStoredLocale(newLocale)
    
    // Update document dir for RTL
    document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr'
    document.documentElement.lang = newLocale
  }, [])

  return {
    locale,
    setLocale,
    locales,
    localeNames,
    isRTL: isRTL(locale),
  }
}

// ============================================
// Format Utilities
// ============================================

/**
 * Format number according to Indian numbering system
 */
export function formatIndianNumber(num: number, locale: Locale = 'en'): string {
  const indianLocale = locale === 'en' ? 'en-IN' : `${locale}-IN`
  
  try {
    return new Intl.NumberFormat(indianLocale, {
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return new Intl.NumberFormat('en-IN').format(num)
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatIndianCurrency(amount: number, locale: Locale = 'en'): string {
  const indianLocale = locale === 'en' ? 'en-IN' : `${locale}-IN`
  
  try {
    return new Intl.NumberFormat(indianLocale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${formatIndianNumber(amount, locale)}`
  }
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const indianLocale = locale === 'en' ? 'en-IN' : `${locale}-IN`
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  try {
    return new Intl.DateTimeFormat(indianLocale, { ...defaultOptions, ...options }).format(d)
  } catch {
    return d.toLocaleDateString('en-IN', { ...defaultOptions, ...options })
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string, locale: Locale = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const indianLocale = locale === 'en' ? 'en-IN' : `${locale}-IN`

  try {
    const rtf = new Intl.RelativeTimeFormat(indianLocale, { numeric: 'auto' })

    if (diffSec < 60) return rtf.format(-diffSec, 'second')
    if (diffMin < 60) return rtf.format(-diffMin, 'minute')
    if (diffHour < 24) return rtf.format(-diffHour, 'hour')
    if (diffDay < 30) return rtf.format(-diffDay, 'day')
    
    return formatDate(d, locale)
  } catch {
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    return `${diffDay}d ago`
  }
}

// ============================================
// Export
// ============================================

export { locales, localeNames, defaultLocale, isRTL }
export type { Locale }
