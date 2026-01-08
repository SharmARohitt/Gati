/**
 * GATI Touch Gesture Hooks
 * Touch and swipe gesture support for mobile devices
 */

'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

// ============================================
// Types
// ============================================

interface SwipeDirection {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeOptions {
  threshold?: number // Minimum distance for swipe
  preventDefaultTouchmove?: boolean
}

interface TouchPosition {
  x: number
  y: number
}

interface PinchState {
  scale: number
  distance: number
}

interface LongPressOptions {
  delay?: number
  onLongPress: () => void
  onPress?: () => void
}

// ============================================
// useSwipe Hook
// ============================================

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, preventDefaultTouchmove = false } = options
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)
  const elementRef = useRef<HTMLElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
    touchEnd.current = null
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmove) {
      e.preventDefault()
    }
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [preventDefaultTouchmove])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const distanceX = touchEnd.current.x - touchStart.current.x
    const distanceY = touchEnd.current.y - touchStart.current.y
    const absX = Math.abs(distanceX)
    const absY = Math.abs(distanceY)

    // Determine if it's a horizontal or vertical swipe
    const isHorizontal = absX > absY

    if (isHorizontal && absX > threshold) {
      if (distanceX > 0) {
        handlers.onSwipeRight?.()
      } else {
        handlers.onSwipeLeft?.()
      }
    } else if (!isHorizontal && absY > threshold) {
      if (distanceY > 0) {
        handlers.onSwipeDown?.()
      } else {
        handlers.onSwipeUp?.()
      }
    }

    // Reset
    touchStart.current = null
    touchEnd.current = null
  }, [handlers, threshold])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmove })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefaultTouchmove])

  return elementRef
}

// ============================================
// useSwipeDrawer Hook
// ============================================

export function useSwipeDrawer(
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  options: { edge?: 'left' | 'right'; edgeThreshold?: number } = {}
) {
  const { edge = 'left', edgeThreshold = 20 } = options
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const startX = useRef<number>(0)
  const currentX = useRef<number>(0)
  const drawerWidth = 280 // Match sidebar width

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      
      if (isOpen) {
        // Allow swipe to close from anywhere
        startX.current = touch.clientX
        setIsSwiping(true)
      } else {
        // Only allow swipe to open from edge
        const isFromEdge = edge === 'left' 
          ? touch.clientX < edgeThreshold
          : touch.clientX > window.innerWidth - edgeThreshold
        
        if (isFromEdge) {
          startX.current = touch.clientX
          setIsSwiping(true)
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return

      const touch = e.touches[0]
      currentX.current = touch.clientX
      const delta = currentX.current - startX.current

      if (edge === 'left') {
        if (isOpen) {
          // Swiping left to close
          const progress = Math.max(0, Math.min(1, 1 + delta / drawerWidth))
          setSwipeProgress(progress)
        } else {
          // Swiping right to open
          const progress = Math.max(0, Math.min(1, delta / drawerWidth))
          setSwipeProgress(progress)
        }
      } else {
        if (isOpen) {
          // Swiping right to close
          const progress = Math.max(0, Math.min(1, 1 - delta / drawerWidth))
          setSwipeProgress(progress)
        } else {
          // Swiping left to open
          const progress = Math.max(0, Math.min(1, -delta / drawerWidth))
          setSwipeProgress(progress)
        }
      }
    }

    const handleTouchEnd = () => {
      if (!isSwiping) return

      const threshold = 0.3

      if (isOpen) {
        if (swipeProgress < 1 - threshold) {
          onClose()
        }
      } else {
        if (swipeProgress > threshold) {
          onOpen()
        }
      }

      setIsSwiping(false)
      setSwipeProgress(0)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, onOpen, onClose, edge, edgeThreshold, isSwiping, swipeProgress])

  return { isSwiping, swipeProgress }
}

// ============================================
// usePinchZoom Hook
// ============================================

export function usePinchZoom(
  options: {
    minScale?: number
    maxScale?: number
    onChange?: (scale: number) => void
  } = {}
) {
  const { minScale = 0.5, maxScale = 3, onChange } = options
  const elementRef = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)
  const initialDistance = useRef<number>(0)
  const initialScale = useRef<number>(1)

  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getDistance(e.touches)
        initialScale.current = scale
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches)
        const newScale = (currentDistance / initialDistance.current) * initialScale.current
        const clampedScale = Math.min(maxScale, Math.max(minScale, newScale))
        setScale(clampedScale)
        onChange?.(clampedScale)
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [scale, minScale, maxScale, onChange])

  return { ref: elementRef, scale, setScale }
}

// ============================================
// useLongPress Hook
// ============================================

export function useLongPress(options: LongPressOptions) {
  const { delay = 500, onLongPress, onPress } = options
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  const startPos = useRef<TouchPosition | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isLongPress.current = false
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }

    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, delay)
  }, [delay, onLongPress])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return

    const dx = Math.abs(e.touches[0].clientX - startPos.current.x)
    const dy = Math.abs(e.touches[0].clientY - startPos.current.y)

    // Cancel if moved more than 10px
    if (dx > 10 || dy > 10) {
      clear()
    }
  }, [clear])

  const onTouchEnd = useCallback(() => {
    clear()
    if (!isLongPress.current) {
      onPress?.()
    }
    startPos.current = null
  }, [clear, onPress])

  const onMouseDown = useCallback(() => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, delay)
  }, [delay, onLongPress])

  const onMouseUp = useCallback(() => {
    clear()
    if (!isLongPress.current) {
      onPress?.()
    }
  }, [clear, onPress])

  const onMouseLeave = useCallback(() => {
    clear()
  }, [clear])

  useEffect(() => {
    return clear
  }, [clear])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  }
}

// ============================================
// useDoubleTap Hook
// ============================================

export function useDoubleTap(
  callback: () => void,
  delay: number = 300
) {
  const lastTap = useRef<number>(0)

  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap.current < delay) {
      callback()
      lastTap.current = 0
    } else {
      lastTap.current = now
    }
  }, [callback, delay])

  return handleDoubleTap
}

// ============================================
// usePullToRefresh Hook
// ============================================

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: { threshold?: number; maxPull?: number } = {}
) {
  const { threshold = 80, maxPull = 120 } = options
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scroll
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return

      const currentY = e.touches[0].clientY
      const delta = currentY - startY.current

      if (delta > 0) {
        e.preventDefault()
        const distance = Math.min(maxPull, delta * 0.5)
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }

      setIsPulling(false)
      setPullDistance(0)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, maxPull, onRefresh])

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(1, pullDistance / threshold),
  }
}

// ============================================
// Detect Touch Device
// ============================================

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouch()
    window.addEventListener('touchstart', () => setIsTouch(true), { once: true })
  }, [])

  return isTouch
}

// ============================================
// Export
// ============================================

export default {
  useSwipe,
  useSwipeDrawer,
  usePinchZoom,
  useLongPress,
  useDoubleTap,
  usePullToRefresh,
  useIsTouchDevice,
}
