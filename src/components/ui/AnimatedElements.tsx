'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  useIndianFormat?: boolean
}

export function AnimatedCounter({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  useIndianFormat = true
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)

  const formatNumber = (num: number): string => {
    if (useIndianFormat && num >= 1000) {
      // Indian numbering system
      const str = Math.round(num).toString()
      let lastThree = str.substring(str.length - 3)
      const otherNumbers = str.substring(0, str.length - 3)
      if (otherNumbers !== '') {
        lastThree = ',' + lastThree
      }
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree
    }
    return num.toFixed(decimals)
  }

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = easeOutQuart * value

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  )
}

// Pulsing dot indicator
export function PulsingDot({ 
  color = 'bg-gati-accent',
  size = 'w-2 h-2'
}: { 
  color?: string
  size?: string 
}) {
  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${size} ${color}`} />
    </span>
  )
}

// Glowing border effect
export function GlowingBorder({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gati-accent to-gati-secondary rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

// Animated grid background
export function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(72, 202, 228, 0.08) 0%, transparent 70%)'
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  )
}

// Floating particles effect
export function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gati-accent/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

// Status badge component
export function StatusBadge({ 
  status, 
  size = 'default' 
}: { 
  status: 'active' | 'pending' | 'resolved' | 'assigned' | 'in-progress' | 'in-field' | string
  size?: 'small' | 'default' 
}) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
    pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
    resolved: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Resolved' },
    assigned: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Assigned' },
    'in-progress': { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'In Progress' },
    'in-field': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'In Field' }
  }

  const defaultConfig = { color: 'bg-gray-50 text-gray-700 border-gray-200', label: status || 'Unknown' }
  const config = statusConfig[status] || defaultConfig
  const sizeClasses = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  const dotColor = 
    status === 'active' ? 'bg-emerald-500 animate-pulse' :
    status === 'pending' ? 'bg-amber-500' :
    status === 'resolved' ? 'bg-blue-500' :
    status === 'assigned' ? 'bg-purple-500' :
    status === 'in-progress' ? 'bg-cyan-500 animate-pulse' :
    status === 'in-field' ? 'bg-orange-500 animate-pulse' :
    'bg-gray-500'

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      {config.label}
    </span>
  )
}

// Severity badge component
export function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' | string }) {
  const severityConfig: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Low' },
    medium: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Medium' },
    high: { color: 'bg-red-50 text-red-700 border-red-200', label: 'High' },
    critical: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Critical' }
  }

  const defaultConfig = { color: 'bg-gray-50 text-gray-700 border-gray-200', label: severity || 'Unknown' }
  const config = severityConfig[severity] || defaultConfig

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}

// Progress bar component
export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'bg-gati-accent',
  showLabel = true,
  size = 'default'
}: { 
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  size?: 'small' | 'default' | 'large'
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const heightClasses = {
    small: 'h-1',
    default: 'h-2',
    large: 'h-3'
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gati-muted text-right">
          {percentage.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

// Confidence meter for AI
export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const getColor = (conf: number) => {
    if (conf >= 90) return 'bg-emerald-500'
    if (conf >= 75) return 'bg-cyan-500'
    if (conf >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getColor(confidence)}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <span className="text-sm font-medium text-gati-text min-w-[3rem] text-right">
        {confidence.toFixed(1)}%
      </span>
    </div>
  )
}

// Loading skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="gati-panel p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}
