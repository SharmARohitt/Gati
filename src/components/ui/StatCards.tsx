'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Baby,
  Fingerprint,
  PieChart,
  AlertCircle
} from 'lucide-react'
import { AnimatedCounter, ProgressBar } from './AnimatedElements'
import { formatIndianNumber } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  change?: number
  trend?: 'up' | 'down'
  icon: string
  delay?: number
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  refresh: RefreshCw,
  baby: Baby,
  fingerprint: Fingerprint,
  chart: PieChart,
  alert: AlertCircle
}

export function StatCard({ label, value, suffix = '', change, trend, icon, delay = 0 }: StatCardProps) {
  const Icon = iconMap[icon] || Users
  const isPositive = trend === 'up'
  
  return (
    <motion.div
      className="gati-stat-card group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-gati-light/30 to-gati-accent/20 group-hover:from-gati-accent/30 group-hover:to-gati-secondary/20 transition-all duration-300">
          <Icon className="w-5 h-5 text-gati-secondary" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold text-gati-text">
          {suffix === '%' ? (
            <AnimatedCounter value={value} suffix="%" decimals={1} useIndianFormat={false} />
          ) : (
            <AnimatedCounter value={value} useIndianFormat={true} />
          )}
        </span>
      </div>
      
      <p className="text-sm text-gati-muted font-medium">{label}</p>
    </motion.div>
  )
}

// Large hero stat for landing page
interface HeroStatProps {
  label: string
  value: number
  suffix?: string
  description?: string
}

export function HeroStat({ label, value, suffix = '', description }: HeroStatProps) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
        <AnimatedCounter 
          value={value} 
          suffix={suffix} 
          decimals={suffix === '%' ? 1 : 0}
          useIndianFormat={suffix !== '%'}
        />
      </div>
      <p className="text-gati-primary font-semibold mb-1">{label}</p>
      {description && (
        <p className="text-sm text-gati-muted">{description}</p>
      )}
    </div>
  )
}

// Pulse strip stat for live updates
interface PulseStatProps {
  label: string
  value: number
  suffix?: string
  status?: 'normal' | 'warning' | 'critical'
}

export function PulseStat({ label, value, suffix = '', status = 'normal' }: PulseStatProps) {
  const statusColors = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  }
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100">
      <span className={`w-2 h-2 rounded-full animate-pulse ${statusColors[status]}`} />
      <div>
        <p className="text-xs text-gati-muted uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gati-primary">
          {typeof value === 'number' && value > 1000 
            ? formatIndianNumber(value)
            : value
          }{suffix}
        </p>
      </div>
    </div>
  )
}

// State coverage card for map details
interface StateCoverageCardProps {
  state: {
    name: string
    coverage: number
    enrolments: number
    updates: number
    freshness: number
    risk: string
  }
}

export function StateCoverageCard({ state }: StateCoverageCardProps) {
  const riskColors = {
    low: 'border-emerald-300 bg-emerald-50',
    medium: 'border-amber-300 bg-amber-50',
    high: 'border-red-300 bg-red-50',
    critical: 'border-purple-300 bg-purple-50'
  }
  
  return (
    <motion.div
      className="gati-panel p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gati-text">{state.name}</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${riskColors[state.risk as keyof typeof riskColors]}`}>
          {state.risk.charAt(0).toUpperCase() + state.risk.slice(1)} Risk
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gati-muted">Coverage</span>
            <span className="font-medium text-gati-text">{state.coverage}%</span>
          </div>
          <ProgressBar value={state.coverage} showLabel={false} size="small" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gati-muted">Enrolments</p>
            <p className="font-semibold text-gati-text">{formatIndianNumber(state.enrolments)}</p>
          </div>
          <div>
            <p className="text-xs text-gati-muted">Monthly Updates</p>
            <p className="font-semibold text-gati-text">{formatIndianNumber(state.updates)}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gati-muted">Update Freshness</span>
            <span className="font-medium text-gati-text">{state.freshness}%</span>
          </div>
          <ProgressBar 
            value={state.freshness} 
            showLabel={false} 
            size="small"
            color={state.freshness > 90 ? 'bg-emerald-500' : state.freshness > 80 ? 'bg-amber-500' : 'bg-red-500'}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Dashboard quick stats row
export function QuickStats() {
  const stats = [
    { label: 'Total Enrolments', value: 1389000000, icon: 'users', change: 0.12, trend: 'up' as const },
    { label: 'Monthly Updates', value: 28500000, icon: 'refresh', change: 8.4, trend: 'up' as const },
    { label: 'Child Enrolments (0-5)', value: 89400000, icon: 'baby', change: 2.1, trend: 'up' as const },
    { label: 'Biometric Updates', value: 12800000, icon: 'fingerprint', change: -3.2, trend: 'down' as const },
    { label: 'National Coverage', value: 97.2, suffix: '%', icon: 'chart', change: 0.3, trend: 'up' as const },
    { label: 'Active Issues', value: 1847, icon: 'alert', change: -12.5, trend: 'down' as const }
  ]
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          change={stat.change}
          trend={stat.trend}
          icon={stat.icon}
          delay={index}
        />
      ))}
    </div>
  )
}
