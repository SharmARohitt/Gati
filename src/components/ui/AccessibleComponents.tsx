/**
 * GATI Accessible UI Components
 * WCAG 2.1 AA compliant components with full keyboard and screen reader support
 */

'use client'

import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { generateA11yId, usePrefersReducedMotion } from '@/lib/a11y'
import { cn } from '@/lib/utils'

// ============================================
// Accessible Button
// ============================================

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  'aria-label'?: string
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion()
    
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
    
    const variants = {
      primary: 'bg-gati-primary text-white hover:bg-gati-primary/90 focus-visible:ring-gati-primary',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    }

    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 
              className={cn(
                'animate-spin',
                size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
              )} 
              aria-hidden="true"
            />
            <span>{loadingText || 'Loading...'}</span>
            <span className="sr-only">Please wait</span>
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

// ============================================
// Accessible Input
// ============================================

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  isRequired?: boolean
  hideLabel?: boolean
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      hint,
      isRequired = false,
      hideLabel = false,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const id = providedId || generateA11yId('input')
    const hintId = hint ? `${id}-hint` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {isRequired && (
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          )}
          {isRequired && <span className="sr-only">(required)</span>}
        </label>
        
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-gati-primary focus:border-gati-primary',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            className
          )}
          aria-required={isRequired}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}

        {error && (
          <p 
            id={errorId} 
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'

// ============================================
// Accessible Modal / Dialog
// ============================================

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: AccessibleModalProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const titleId = generateA11yId('modal-title')
  const descId = description ? generateA11yId('modal-desc') : undefined

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? {} : { opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative bg-white rounded-xl shadow-2xl p-6 w-full mx-4',
          sizes[size]
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gati-primary"
          aria-label="Close dialog"
        >
          <span aria-hidden="true">✕</span>
        </button>

        {/* Title */}
        <h2
          id={titleId}
          className="text-xl font-bold text-gray-900 pr-8"
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p id={descId} className="mt-2 text-gray-600">
            {description}
          </p>
        )}

        {/* Content */}
        <div className="mt-4">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ============================================
// Accessible Alert
// ============================================

interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  onDismiss?: () => void
  isDismissible?: boolean
}

export function AccessibleAlert({
  type,
  title,
  children,
  onDismiss,
  isDismissible = false,
}: AccessibleAlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠',
    error: '✕',
  }

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'p-4 rounded-lg border flex gap-3',
        styles[type]
      )}
    >
      <span aria-hidden="true" className="text-lg">
        {icons[type]}
      </span>
      
      <div className="flex-1">
        {title && (
          <p className="font-semibold">{title}</p>
        )}
        <div className={title ? 'mt-1' : ''}>
          {children}
        </div>
      </div>

      {isDismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-black/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss alert"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  )
}

// ============================================
// Skip Link
// ============================================

interface SkipLinkProps {
  href?: string
  children?: ReactNode
}

export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gati-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gati-primary"
    >
      {children}
    </a>
  )
}

// ============================================
// Visually Hidden (Screen Reader Only)
// ============================================

interface VisuallyHiddenProps {
  children: ReactNode
  as?: 'span' | 'div' | 'p'
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  )
}

// ============================================
// Progress Bar (Accessible)
// ============================================

interface AccessibleProgressProps {
  value: number
  max?: number
  label: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'primary',
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100)

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const colors = {
    primary: 'bg-gati-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showValue && (
          <span className="text-sm text-gray-500" aria-hidden="true">
            {percentage}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}%`}
        className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}
      >
        <div
          className={cn('h-full transition-all duration-300', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// Accessible Table
// ============================================

interface AccessibleTableProps {
  caption: string
  headers: string[]
  rows: (string | ReactNode)[][]
  className?: string
}

export function AccessibleTable({ caption, headers, rows, className }: AccessibleTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Export all components
export {
  AccessibleButton as Button,
  AccessibleInput as Input,
  AccessibleModal as Modal,
  AccessibleAlert as Alert,
  AccessibleProgress as Progress,
  AccessibleTable as Table,
}
