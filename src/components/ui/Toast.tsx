/**
 * GATI Toast Notification System
 * Beautiful, accessible toast notifications with Sonner
 */

'use client'

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import React from 'react'

// ============================================
// Toast Configuration
// ============================================

export interface ToastOptions {
  description?: string
  duration?: number
  id?: string | number
}

// ============================================
// Toast Functions
// ============================================

/**
 * Show a success toast
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    description: options?.description,
    duration: options?.duration,
    id: options?.id,
  })
}

/**
 * Show an error toast
 */
export function toastError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    duration: options?.duration ?? 5000, // Errors stay longer
    description: options?.description,
    id: options?.id,
  })
}

/**
 * Show a warning toast
 */
export function toastWarning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    description: options?.description,
    duration: options?.duration,
    id: options?.id,
  })
}

/**
 * Show an info toast
 */
export function toastInfo(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    description: options?.description,
    duration: options?.duration,
    id: options?.id,
  })
}

/**
 * Show a loading toast (returns ID for updating)
 */
export function toastLoading(message: string, options?: ToastOptions) {
  return sonnerToast.loading(message, {
    icon: <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />,
    description: options?.description,
    duration: options?.duration,
    id: options?.id,
  })
}

/**
 * Show a promise toast (auto-updates on resolve/reject)
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  },
  options?: ToastOptions
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    description: options?.description,
  })
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId?: string | number) {
  sonnerToast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  sonnerToast.dismiss()
}

// ============================================
// Custom Toast Component
// ============================================

interface CustomToastProps {
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
}

export function showCustomToast({
  title,
  description,
  type,
  action,
}: CustomToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const styles = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  }

  return sonnerToast.custom((t) => (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[type]}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span aria-hidden="true">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick()
              sonnerToast.dismiss(t)
            }}
            className="mt-2 text-sm font-medium text-gati-primary hover:underline focus:outline-none focus:ring-2 focus:ring-gati-primary focus:ring-offset-2 rounded"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => sonnerToast.dismiss(t)}
        className="p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <XCircle className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  ))
}

// ============================================
// Toaster Provider Component
// ============================================

interface ToasterProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
  duration?: number
}

export function Toaster({
  position = 'top-right',
  expand = false,
  richColors = true,
  closeButton = true,
  duration = 4000,
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      duration={duration}
      toastOptions={{
        className: 'font-sans',
        style: {
          fontFamily: 'var(--font-sans)',
        },
      }}
      // Accessibility
      aria-live="polite"
      aria-atomic="true"
    />
  )
}

// ============================================
// Hook for Toast Notifications
// ============================================

export function useToast() {
  return {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    loading: toastLoading,
    promise: toastPromise,
    custom: showCustomToast,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  }
}

// ============================================
// Utility: Async Action with Toast
// ============================================

interface AsyncActionOptions<T> {
  loadingMessage?: string
  successMessage?: string | ((data: T) => string)
  errorMessage?: string | ((error: Error) => string)
}

export async function withToast<T>(
  action: () => Promise<T>,
  options: AsyncActionOptions<T> = {}
): Promise<T> {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Success!',
    errorMessage = 'An error occurred',
  } = options

  const toastId = toastLoading(loadingMessage)

  try {
    const result = await action()
    const message = typeof successMessage === 'function' 
      ? successMessage(result) 
      : successMessage
    
    sonnerToast.dismiss(toastId)
    toastSuccess(message)
    
    return result
  } catch (error) {
    const message = typeof errorMessage === 'function'
      ? errorMessage(error as Error)
      : errorMessage
    
    sonnerToast.dismiss(toastId)
    toastError(message)
    
    throw error
  }
}

// ============================================
// Export All
// ============================================

export const toast = {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  custom: showCustomToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
}

export default toast
