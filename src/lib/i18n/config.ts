/**
 * GATI Internationalization Configuration
 * Multi-language support for Indian government platform
 */

import { getRequestConfig } from 'next-intl/server'

// Supported locales
export const locales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  bn: 'বাংলা',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
}

// RTL languages (none for Indian languages, but keeping for future)
export const rtlLocales: Locale[] = []

// Check if locale is RTL
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

// Get locale from request
export default getRequestConfig(async ({ locale }) => ({
  locale: locale as string,
  messages: (await import(`../messages/${locale}.json`)).default
}))
