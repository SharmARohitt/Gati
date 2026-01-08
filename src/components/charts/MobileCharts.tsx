/**
 * GATI Mobile-Optimized Charts
 * Responsive chart wrappers with touch support for mobile devices
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2, RefreshCw, Download, Info } from 'lucide-react'
import { useIsTouchDevice, usePinchZoom, useDoubleTap } from '@/lib/gestures'

// ============================================
// Types
// ============================================

interface MobileChartWrapperProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  onRefresh?: () => Promise<void>
  onExport?: () => void
  loading?: boolean
  error?: string | null
  info?: string
  className?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string }>
  label?: string
  formatter?: (value: number) => string
}

// ============================================
// Mobile Chart Wrapper
// ============================================

export function MobileChartWrapper({
  title,
  subtitle,
  children,
  onRefresh,
  onExport,
  loading = false,
  error = null,
  info,
  className = '',
}: MobileChartWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const isTouch = useIsTouchDevice()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDoubleTap = useDoubleTap(() => {
    setIsFullscreen((prev) => !prev)
  })

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  return (
    <>
      {/* Regular View */}
      <div
        ref={containerRef}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
        onClick={isTouch ? handleDoubleTap : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            {info && (
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Show info"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Refresh chart"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Export chart"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && info && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-sm text-blue-700">{info}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart Content */}
        <div className="p-4 relative">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-gati-primary/20 border-t-gati-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-red-500 font-medium">{error}</p>
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm text-gati-primary hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <div className="touch-pan-x touch-pan-y">
              {children}
            </div>
          )}

          {isTouch && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Double tap to expand
            </p>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 safe-area-top">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Exit fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Fullscreen Chart */}
            <div className="flex-1 p-4 overflow-auto safe-area-bottom">
              <ZoomableChartContainer>
                {children}
              </ZoomableChartContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// Zoomable Chart Container (Pinch to Zoom)
// ============================================

export function ZoomableChartContainer({
  children,
  minScale = 1,
  maxScale = 3,
}: {
  children: React.ReactNode
  minScale?: number
  maxScale?: number
}) {
  const { ref, scale, setScale } = usePinchZoom({ minScale, maxScale })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      isDragging.current = true
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      startOffset.current = { ...position }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startPos.current.x
      const dy = e.touches[0].clientY - startPos.current.y
      setPosition({
        x: startOffset.current.x + dx,
        y: startOffset.current.y + dy,
      })
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  const handleDoubleTap = useDoubleTap(() => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Reset button */}
      {(scale !== 1 || position.x !== 0 || position.y !== 0) && (
        <button
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }}
          className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs px-3 py-1.5 rounded-full shadow-md"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ============================================
// Responsive Chart Height
// ============================================

export function ResponsiveChartHeight({
  children,
  mobileHeight = 200,
  tabletHeight = 280,
  desktopHeight = 360,
}: {
  children: (height: number) => React.ReactNode
  mobileHeight?: number
  tabletHeight?: number
  desktopHeight?: number
}) {
  const [height, setHeight] = useState(mobileHeight)
  const containerRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateHeight = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setHeight(desktopHeight)
      } else if (width >= 768) {
        setHeight(tabletHeight)
      } else {
        setHeight(mobileHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [mobileHeight, tabletHeight, desktopHeight])

  return (
    <div ref={containerRef}>
      {children(height)}
    </div>
  )
}

// ============================================
// Mobile-Friendly Tooltip
// ============================================

export function MobileChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => v.toLocaleString('en-IN'),
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[150px] max-w-[250px]">
      {label && (
        <p className="text-sm font-medium text-gray-900 mb-2 border-b border-gray-100 pb-2">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color || '#0FA0A0' }}
              />
              <span className="text-sm text-gray-600 truncate">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Chart Legend (Mobile-Friendly)
// ============================================

interface LegendItem {
  key: string
  label: string
  color: string
  value?: number
}

export function MobileChartLegend({
  items,
  formatter = (v) => v.toLocaleString('en-IN'),
  onToggle,
  activeKeys,
}: {
  items: LegendItem[]
  formatter?: (value: number) => string
  onToggle?: (key: string) => void
  activeKeys?: Set<string>
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4 px-2">
      {items.map((item) => {
        const isActive = !activeKeys || activeKeys.has(item.key)

        return (
          <button
            key={item.key}
            onClick={() => onToggle?.(item.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'bg-gray-50 text-gray-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate max-w-[120px]">{item.label}</span>
            {item.value !== undefined && (
              <span className="font-medium">{formatter(item.value)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// Chart Empty State
// ============================================

export function ChartEmptyState({
  title = 'No data available',
  description = 'There is no data to display for this chart.',
  action,
  onAction,
}: {
  title?: string
  description?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 max-w-[250px]">{description}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-sm text-gati-primary font-medium hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  )
}

// ============================================
// Export
// ============================================

export default MobileChartWrapper
