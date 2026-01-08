/**
 * GATI Performance Optimization Utilities
 * Lazy loading, memoization, and virtualization helpers
 */

'use client'

import React, {
  lazy,
  Suspense,
  ComponentType,
  LazyExoticComponent,
  memo,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react'
import { useInView } from 'react-intersection-observer'

// ============================================
// Lazy Loading with Preload
// ============================================

interface LazyComponentOptions {
  fallback?: React.ReactNode
  preload?: boolean
}

/**
 * Create a lazy-loaded component with optional preloading
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> & { preload: () => void } {
  const LazyComponent = lazy(factory) as LazyExoticComponent<T> & { preload: () => void }
  
  // Add preload function
  LazyComponent.preload = () => {
    factory()
  }

  return LazyComponent
}

/**
 * Wrapper for lazy components with loading state
 */
export function LazyLoad<P extends object>({
  component: Component,
  fallback,
  ...props
}: {
  component: LazyExoticComponent<ComponentType<P>>
  fallback?: React.ReactNode
} & P) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gati-primary rounded-full animate-spin" />
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Component {...(props as any)} />
    </Suspense>
  )
}

// ============================================
// Heavy Components (Lazy Loaded)
// ============================================

// Recharts components
export const LazyAreaChart = createLazyComponent(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart as ComponentType<unknown> }))
)

export const LazyLineChart = createLazyComponent(
  () => import('recharts').then((mod) => ({ default: mod.LineChart as ComponentType<unknown> }))
)

export const LazyBarChart = createLazyComponent(
  () => import('recharts').then((mod) => ({ default: mod.BarChart as ComponentType<unknown> }))
)

export const LazyPieChart = createLazyComponent(
  () => import('recharts').then((mod) => ({ default: mod.PieChart as ComponentType<unknown> }))
)

// Three.js components (very heavy)
export const LazyCanvas = createLazyComponent(
  () => import('@react-three/fiber').then((mod) => ({ default: mod.Canvas as ComponentType<unknown> }))
)

// ============================================
// Virtualization
// ============================================

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

/**
 * Simple virtualized list for large datasets
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Intersection Observer Loading
// ============================================

interface LazyRenderProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

/**
 * Render children only when in viewport
 */
export function LazyRender({
  children,
  placeholder,
  rootMargin = '100px',
  threshold = 0,
  triggerOnce = true,
}: LazyRenderProps) {
  const { ref, inView } = useInView({
    rootMargin,
    threshold,
    triggerOnce,
  })

  return (
    <div ref={ref}>
      {inView ? children : placeholder || <div className="h-32 bg-gray-100 animate-pulse rounded" />}
    </div>
  )
}

// ============================================
// Image Optimization
// ============================================

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
}

/**
 * Optimized image with lazy loading and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true)
      onLoad?.()
    }
  }, [onLoad])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

// ============================================
// Debounce & Throttle
// ============================================

/**
 * Debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )
}

/**
 * Throttle hook
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastUpdated = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, interval - (now - lastUpdated.current))

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

// ============================================
// Memoization Helpers
// ============================================

/**
 * Deep comparison memo wrapper
 */
export function createMemoComponent<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, areEqual)
}

/**
 * Hook for expensive computations
 */
export function useExpensiveComputation<T>(
  compute: () => T,
  deps: React.DependencyList
): T {
  return useMemo(compute, deps)
}

// ============================================
// Resource Preloading
// ============================================

/**
 * Preload critical resources
 */
export function preloadResources(resources: Array<{ href: string; as: string }>) {
  if (typeof document === 'undefined') return

  resources.forEach(({ href, as }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  })
}

/**
 * Preload image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Hook to preload images on hover
 */
export function useImagePreload(images: string[]) {
  const preloadedRef = useRef(new Set<string>())

  const preload = useCallback(() => {
    images.forEach((src) => {
      if (!preloadedRef.current.has(src)) {
        preloadedRef.current.add(src)
        preloadImage(src).catch(() => {
          // Ignore preload errors
        })
      }
    })
  }, [images])

  return { preload }
}

// ============================================
// Export
// ============================================

export default {
  LazyLoad,
  VirtualList,
  LazyRender,
  OptimizedImage,
  createLazyComponent,
  createMemoComponent,
  preloadResources,
  preloadImage,
}
