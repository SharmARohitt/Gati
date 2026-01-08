/**
 * GATI Accessibility Utilities
 * Comprehensive A11y support for government-grade accessibility
 */

import { useCallback, useEffect, useRef, KeyboardEvent } from 'react'

// ============================================
// ARIA Helpers
// ============================================

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function generateA11yId(prefix: string = 'gati'): string {
  idCounter += 1
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Common ARIA props for interactive elements
 */
export interface AriaButtonProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-pressed'?: boolean
  'aria-expanded'?: boolean
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-controls'?: string
  'aria-disabled'?: boolean
  role?: string
  tabIndex?: number
}

export interface AriaInputProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  'aria-errormessage'?: string
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both'
  role?: string
}

// ============================================
// Keyboard Navigation
// ============================================

export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

/**
 * Handle keyboard navigation for button-like elements
 */
export function handleButtonKeyDown(
  event: KeyboardEvent,
  onClick: () => void
): void {
  if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
    event.preventDefault()
    onClick()
  }
}

/**
 * Handle keyboard navigation for menus/lists
 */
export function handleMenuKeyDown(
  event: KeyboardEvent,
  options: {
    onNext?: () => void
    onPrevious?: () => void
    onFirst?: () => void
    onLast?: () => void
    onSelect?: () => void
    onClose?: () => void
  }
): void {
  const { onNext, onPrevious, onFirst, onLast, onSelect, onClose } = options

  switch (event.key) {
    case KEYS.ARROW_DOWN:
      event.preventDefault()
      onNext?.()
      break
    case KEYS.ARROW_UP:
      event.preventDefault()
      onPrevious?.()
      break
    case KEYS.HOME:
      event.preventDefault()
      onFirst?.()
      break
    case KEYS.END:
      event.preventDefault()
      onLast?.()
      break
    case KEYS.ENTER:
    case KEYS.SPACE:
      event.preventDefault()
      onSelect?.()
      break
    case KEYS.ESCAPE:
      event.preventDefault()
      onClose?.()
      break
  }
}

// ============================================
// Focus Management
// ============================================

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstElement?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}

/**
 * Hook to restore focus when component unmounts
 */
export function useRestoreFocus() {
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement

    return () => {
      previousFocus.current?.focus()
    }
  }, [])
}

/**
 * Hook to skip to main content (skip link)
 */
export function useSkipLink(mainContentId: string = 'main-content') {
  const skipToMain = useCallback(() => {
    const mainContent = document.getElementById(mainContentId)
    if (mainContent) {
      mainContent.tabIndex = -1
      mainContent.focus()
      mainContent.removeAttribute('tabindex')
    }
  }, [mainContentId])

  return skipToMain
}

// ============================================
// Screen Reader Utilities
// ============================================

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Hook for live region announcements
 */
export function useLiveRegion() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority)
  }, [])

  return { announce }
}

// ============================================
// Component Props Helpers
// ============================================

/**
 * Get accessible button props
 */
export function getButtonA11yProps(options: {
  label: string
  description?: string
  isPressed?: boolean
  isExpanded?: boolean
  controls?: string
  isDisabled?: boolean
}): AriaButtonProps {
  return {
    'aria-label': options.label,
    'aria-describedby': options.description,
    'aria-pressed': options.isPressed,
    'aria-expanded': options.isExpanded,
    'aria-controls': options.controls,
    'aria-disabled': options.isDisabled,
    tabIndex: options.isDisabled ? -1 : 0,
    role: 'button',
  }
}

/**
 * Get accessible input props
 */
export function getInputA11yProps(options: {
  label: string
  description?: string
  error?: string
  isRequired?: boolean
  isInvalid?: boolean
}): AriaInputProps {
  const descriptionId = options.description ? generateA11yId('desc') : undefined
  const errorId = options.error ? generateA11yId('error') : undefined

  return {
    'aria-label': options.label,
    'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-required': options.isRequired,
    'aria-invalid': options.isInvalid || !!options.error,
    'aria-errormessage': errorId,
  }
}

/**
 * Get accessible dialog props
 */
export function getDialogA11yProps(options: {
  title: string
  description?: string
  isModal?: boolean
}) {
  const titleId = generateA11yId('dialog-title')
  const descId = options.description ? generateA11yId('dialog-desc') : undefined

  return {
    role: 'dialog' as const,
    'aria-modal': options.isModal ?? true,
    'aria-labelledby': titleId,
    'aria-describedby': descId,
    titleId,
    descriptionId: descId,
  }
}

// ============================================
// Visibility Utilities
// ============================================

/**
 * Visually hidden but accessible to screen readers
 */
export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

// ============================================
// Color Contrast
// ============================================

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(color1.r, color1.g, color1.b)
  const l2 = getLuminance(color2.r, color2.g, color2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG AA standard
 */
export function meetsWCAG_AA(
  contrastRatio: number,
  isLargeText: boolean = false
): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
}

/**
 * Check if contrast meets WCAG AAA standard
 */
export function meetsWCAG_AAA(
  contrastRatio: number,
  isLargeText: boolean = false
): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7
}

// ============================================
// Reduced Motion
// ============================================

/**
 * Hook to detect user's motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

  const getInitialState = () => mediaQuery?.matches ?? false

  const [prefersReducedMotion, setPrefersReducedMotion] = 
    useState<boolean>(getInitialState)

  useEffect(() => {
    if (!mediaQuery) return

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [mediaQuery])

  return prefersReducedMotion
}

// Need to import useState for the hook above
import { useState } from 'react'

// ============================================
// Export All
// ============================================

export const a11y = {
  generateId: generateA11yId,
  keys: KEYS,
  handleButtonKeyDown,
  handleMenuKeyDown,
  announceToScreenReader,
  getButtonA11yProps,
  getInputA11yProps,
  getDialogA11yProps,
  srOnlyStyles,
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
}

export default a11y
