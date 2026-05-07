'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Activity,
  TrendingUp,
  Zap,
  Target,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  GitCompare,
  Table2,
  Loader2,
  ArrowLeft,
  ChevronDown,
  Calendar,
  MapPin,
  X,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export const dynamic = 'force-dynamic'

// --- Types --------------------------------------------------------------------

interface TrendPoint {
  date: string
  enrolments: number
  biometricUpdates: number
  demographicUpdates: number
}

interface StateBarItem {
  state: string
  fullName: string
  enrolments: number
  biometric: number
  demographic: number
  coverage: number
  risk: string
}

interface HeatmapRow {
  state: string
  data: { month: string; value: number }[]
}

interface MicroRow {
  date: string
  enrolments: number
  biometric: number
  demographic: number
  total: number
}

interface PulseInsights {
  totalEnrolments: number
  totalBiometric: number
  totalDemographic: number
  totalActivity: number
  peakDay: { date: string; value: number } | null
  growthPct: number
  mostActiveState: { name: string; enrolments: number } | null
  coverage: number
  freshness: number
  riskLevel: string
}

interface PulseData {
  success: boolean
  meta: {
    stateFilter: string
    monthFilter: string
    yearFilter: string
    compareState: string
    totalRecords: number
    dataLoaded: boolean
  }
  insights: PulseInsights
  trends: TrendPoint[]
  compareTrends: TrendPoint[]
  compareStateData: {
    name: string
    coverage: number
    freshness: number
    riskLevel: string
    totalEnrolments: number
  } | null
  topStatesBar: StateBarItem[]
  heatmap: HeatmapRow[]
  microTable: MicroRow[]
  stateList: string[]
  availableYears: string[]
}

// --- Constants ----------------------------------------------------------------

const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const PRIMARY_COLOR = '#00B4D8'
const SECONDARY_COLOR = '#7C3AED'
const EMERALD = '#10B981'
const AMBER = '#F59E0B'
const ROSE = '#F43F5E'

const RISK_COLORS: Record<string, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

// --- Helpers ------------------------------------------------------------------

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}

function heatColor(value: number, max: number): string {
  if (max === 0) return '#1E293B'
  const ratio = value / max
  if (ratio === 0) return '#1E293B'
  if (ratio < 0.2) return '#0C4A6E'
  if (ratio < 0.4) return '#0369A1'
  if (ratio < 0.6) return '#0284C7'
  if (ratio < 0.8) return '#0EA5E9'
  return '#38BDF8'
}


// --- Sub-components -----------------------------------------------------------

function InsightCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color,
  delay = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  trend?: number
  color: string
  delay?: number
}) {
  const isPositive = trend !== undefined && trend >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 overflow-hidden group hover:border-white/20 transition-all"
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}22` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm font-medium text-white/70">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#060E1F] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-[#00B4D8]/20 border-t-[#00B4D8] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-7 h-7 text-[#00B4D8]" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Loading GatiPulse</h2>
        <p className="text-white/50 text-sm">Fetching real-time ops data�</p>
      </div>
      {/* Skeleton cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center">
        <Zap className="w-8 h-8 text-rose-400" />
      </div>
      <p className="text-rose-400 text-sm font-medium">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  )
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D1B35] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-white/60 mb-2 font-medium">{fmtDate(label)}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D1B35] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-white/70 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}


// --- Main Component -----------------------------------------------------------

export default function GatiPulsePage() {
  // -- State ------------------------------------------------------------------
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedState, setSelectedState] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [compareMode, setCompareMode] = useState(false)
  const [compareState, setCompareState] = useState('')

  // UI
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [showCompareDropdown, setShowCompareDropdown] = useState(false)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [activeSection, setActiveSection] = useState<'trends' | 'bars' | 'heatmap' | 'table'>('trends')
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const stateDropdownRef = useRef<HTMLDivElement>(null)
  const compareDropdownRef = useRef<HTMLDivElement>(null)
  const monthDropdownRef = useRef<HTMLDivElement>(null)

  // -- Fetch ------------------------------------------------------------------
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedState !== 'all') params.set('state', selectedState)
      if (selectedMonth !== 'all') params.set('month', selectedMonth)
      if (selectedYear !== 'all') params.set('year', selectedYear)
      if (compareMode && compareState) params.set('compare', compareState)

      const res = await fetch(`/api/pulse?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: PulseData = await res.json()
      if (!json.success) throw new Error('API returned failure')
      setData(json)
      setLastFetched(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedState, selectedMonth, selectedYear, compareMode, compareState])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target as Node)) {
        setShowStateDropdown(false)
      }
      if (compareDropdownRef.current && !compareDropdownRef.current.contains(e.target as Node)) {
        setShowCompareDropdown(false)
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setShowMonthDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // -- Derived data -----------------------------------------------------------
  const stateList = data?.stateList || []
  const trends = data?.trends || []
  const compareTrends = data?.compareTrends || []
  const topStates = data?.topStatesBar || []
  const heatmap = data?.heatmap || []
  const microTable = data?.microTable || []
  const insights = data?.insights

  // Merge compare trends into chart data
  const chartData = trends.map((t, i) => {
    const base: Record<string, any> = {
      date: t.date,
      enrolments: t.enrolments,
      biometric: t.biometricUpdates,
      demographic: t.demographicUpdates,
    }
    if (compareMode && compareTrends[i]) {
      base.cmpEnrolments = compareTrends[i].enrolments
      base.cmpBiometric = compareTrends[i].biometricUpdates
    }
    return base
  })

  // Heatmap max value for color scaling
  const heatmapMax = heatmap.reduce((max, row) => {
    const rowMax = row.data.reduce((m, d) => Math.max(m, d.value), 0)
    return Math.max(max, rowMax)
  }, 0)

  // -- Render -----------------------------------------------------------------
  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#0A2463]/20 border-t-[#0A2463] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-6 h-6 text-[#0A2463]" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#0A2463] mb-1">Loading Gati Pulse</h2>
        <p className="text-gray-400 text-sm">Fetching real-time ops data�</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl px-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F4F8]">

      {/* -- Header -- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Left: back + branding */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-[#0A2463]">Gati Pulse</h1>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Real-time ops monitoring � 2025</p>
              </div>
            </div>
          </div>

          {/* Right: meta + refresh */}
          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="text-xs text-gray-400 hidden md:block">
                Updated {lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {data?.meta && (
              <span className="text-xs text-gray-400 hidden lg:block">
                {data.meta.totalRecords.toLocaleString()} records
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A2463] hover:bg-[#1E5AA8] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{refreshing ? 'Refreshing�' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>


      {/* -- Main content -- */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* -- Filter Panel -- */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>

            {/* State dropdown � fixed positioning to avoid clipping */}
            <div className="relative" ref={stateDropdownRef}>
              <button
                onClick={() => { setShowStateDropdown(!showStateDropdown); setShowMonthDropdown(false); setShowCompareDropdown(false) }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-700 transition-all min-w-[160px]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span className="flex-1 text-left truncate">
                  {selectedState === 'all' ? 'All States' : selectedState}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showStateDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {['all', ...stateList].map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSelectedState(s); setShowStateDropdown(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                            selectedState === s ? 'text-[#0A2463] bg-blue-50 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {s === 'all' ? 'All States (National)' : s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Month dropdown � fixed positioning */}
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowStateDropdown(false); setShowCompareDropdown(false) }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-700 transition-all min-w-[140px]"
              >
                <Calendar className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span className="flex-1 text-left">
                  {MONTHS.find((m) => m.value === selectedMonth)?.label || 'All Months'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showMonthDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {MONTHS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => { setSelectedMonth(m.value); setShowMonthDropdown(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                            selectedMonth === m.value ? 'text-[#0A2463] bg-blue-50 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Year � 2025 only, static badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0A2463] rounded-xl">
              <span className="text-sm font-semibold text-white">2025</span>
            </div>

            {/* Compare toggle */}
            <button
              onClick={() => {
                setCompareMode(!compareMode)
                if (compareMode) setCompareState('')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                compareMode
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Mode
            </button>

            {/* Compare state dropdown */}
            <AnimatePresence>
              {compareMode && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="relative"
                  ref={compareDropdownRef}
                >
                  <button
                    onClick={() => { setShowCompareDropdown(!showCompareDropdown); setShowStateDropdown(false); setShowMonthDropdown(false) }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-sm text-purple-700 transition-all min-w-[160px]"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span className="flex-1 text-left truncate">
                      {compareState || 'Select state�'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCompareDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showCompareDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white border border-purple-200 rounded-2xl shadow-xl overflow-hidden"
                        style={{ zIndex: 9999 }}
                      >
                        <div className="max-h-64 overflow-y-auto">
                          {stateList
                            .filter((s) => s !== selectedState)
                            .map((s) => (
                              <button
                                key={s}
                                onClick={() => { setCompareState(s); setShowCompareDropdown(false) }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                                  compareState === s ? 'text-purple-700 bg-purple-50 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear filters */}
            {(selectedState !== 'all' || selectedMonth !== 'all') && (
              <button
                onClick={() => { setSelectedState('all'); setSelectedMonth('all') }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        </motion.div>


        {/* -- Error state -- */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <Zap className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-500 text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-[#0A2463] hover:bg-[#1E5AA8] rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* -- Insight Cards -- */}
        {!error && insights && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Activity, label: 'Total Activity', value: fmt(insights.totalActivity), sub: `${fmt(insights.totalEnrolments)} enrolments`, color: '#0A2463', border: 'border-l-[#0A2463]' },
              { icon: Zap, label: 'Peak Day', value: insights.peakDay ? fmtDate(insights.peakDay.date) : '�', sub: insights.peakDay ? `${fmt(insights.peakDay.value)} ops` : 'No data', color: '#F59E0B', border: 'border-l-amber-400' },
              { icon: TrendingUp, label: 'Growth', value: `${insights.growthPct >= 0 ? '+' : ''}${insights.growthPct}%`, sub: '2nd half vs 1st half', color: insights.growthPct >= 0 ? '#10B981' : '#EF4444', border: insights.growthPct >= 0 ? 'border-l-emerald-500' : 'border-l-red-500', trend: insights.growthPct },
              { icon: Target, label: 'Coverage', value: `${insights.coverage.toFixed(1)}%`, sub: `Risk: ${insights.riskLevel}`, color: RISK_COLORS[insights.riskLevel] || '#0A2463', border: `border-l-[${RISK_COLORS[insights.riskLevel] || '#0A2463'}]` },
            ].map(({ icon: Icon, label, value, sub, color, border, trend }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${border} shadow-sm p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(trend).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
                <div className="text-sm font-medium text-gray-600">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* -- Compare mode banner -- */}
        <AnimatePresence>
          {compareMode && data?.compareStateData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border border-purple-200 bg-purple-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">Compare Mode Active</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0A2463]" />
                    <span className="text-gray-700">{selectedState === 'all' ? 'All India' : selectedState}</span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-gray-700">{data.compareStateData.name}</span>
                    <span className="text-xs text-gray-400">
                      ({fmt(data.compareStateData.totalEnrolments)} enrolments � {data.compareStateData.coverage.toFixed(1)}% coverage)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Section tabs -- */}
        {!error && (
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 w-fit shadow-sm">
            {([
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'bars', label: 'State Comparison', icon: BarChart3 },
              { id: 'heatmap', label: 'Heatmap', icon: Table2 },
              { id: 'table', label: 'Data Table', icon: Table2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-[#0A2463] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}


        {/* -- Trends Section -- */}
        <AnimatePresence mode="wait">
          {activeSection === 'trends' && !error && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Activity Trends</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enrolments � Biometric � Demographic over time
                    {compareMode && compareState && ` � Comparing with ${compareState}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#00B4D8] rounded" />
                    <span>Enrolments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#10B981] rounded" />
                    <span>Biometric</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#F59E0B] rounded" />
                    <span>Demographic</span>
                  </div>
                  {compareMode && compareState && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-[#A78BFA] rounded dashed" />
                      <span>{compareState}</span>
                    </div>
                  )}
                </div>
              </div>

              {chartData.length === 0 ? (
                <EmptyState message="No trend data for the selected filters" />
              ) : (
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradEnrolments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradBiometric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradDemographic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradCompare" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={fmt}
                        tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12 }} labelFormatter={fmtDate} labelStyle={{ color: "#1E293B", fontWeight: 600 }} />
                      <Area
                        type="monotone"
                        dataKey="enrolments"
                        name="Enrolments"
                        stroke="#00B4D8"
                        strokeWidth={2}
                        fill="url(#gradEnrolments)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#00B4D8' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="biometric"
                        name="Biometric"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#gradBiometric)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#10B981' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="demographic"
                        name="Demographic"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fill="url(#gradDemographic)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#F59E0B' }}
                      />
                      {compareMode && compareState && (
                        <>
                          <Area
                            type="monotone"
                            dataKey="cmpEnrolments"
                            name={`${compareState} Enrolments`}
                            stroke="#A78BFA"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            fill="url(#gradCompare)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#A78BFA' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cmpBiometric"
                            name={`${compareState} Biometric`}
                            stroke="#C4B5FD"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            fill="none"
                            dot={false}
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}


          {/* -- State Comparison Bar Chart -- */}
          {activeSection === 'bars' && !error && (
            <motion.div
              key="bars"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Top 12 States � Activity Comparison</h2>
                <p className="text-xs text-gray-400 mt-0.5">Enrolments � Biometric � Demographic by state</p>
              </div>

              {topStates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <BarChart3 className="w-10 h-10 text-gray-200" />
                  <p className="text-gray-400 text-sm">No state comparison data available</p>
                </div>
              ) : (
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={topStates}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                      barCategoryGap="20%"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="state"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tickFormatter={fmt}
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                      />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: '#1E293B', fontWeight: 600 }}
                        cursor={{ fill: 'rgba(10,36,99,0.04)' }}
                      />
                      <Legend wrapperStyle={{ color: '#64748B', fontSize: 12, paddingTop: 16 }} />
                      <Bar dataKey="enrolments" name="Enrolments" fill="#0A2463" radius={[4, 4, 0, 0]}>
                        {topStates.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fullName === selectedState ? '#1E5AA8' : '#0A2463'}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="biometric" name="Biometric" fill="#00B4D8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="demographic" name="Demographic" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* State cards */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {topStates.map((s) => (
                      <div
                        key={s.state}
                        className={`rounded-xl border p-3 hover:shadow-md transition-all cursor-pointer ${
                          selectedState === s.fullName ? 'border-[#0A2463] bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                        onClick={() => setSelectedState(s.fullName)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-800">{s.state}</span>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${RISK_COLORS[s.risk] || '#6B7280'}15`, color: RISK_COLORS[s.risk] || '#6B7280' }}
                          >
                            {s.risk}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#0A2463]">{fmt(s.enrolments)}</div>
                        <div className="text-[10px] text-gray-400 truncate">{s.fullName}</div>
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0A2463] to-[#00B4D8] rounded-full" style={{ width: `${Math.min(s.coverage, 100)}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">{s.coverage.toFixed(0)}% coverage</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {/* -- Heatmap Section -- */}
          {activeSection === 'heatmap' && !error && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">State � Month Activity Heatmap</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Combined enrolments + biometric activity per state per month</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Low</span>
                  {['#EFF6FF', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8'].map((c) => (
                    <div key={c} className="w-5 h-4 rounded border border-gray-100" style={{ background: c }} />
                  ))}
                  <span>High</span>
                </div>
              </div>

              {heatmap.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <BarChart3 className="w-10 h-10 text-gray-200" />
                  <p className="text-gray-400 text-sm">No heatmap data available</p>
                </div>
              ) : (
                <div className="p-6 overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="text-left text-xs text-gray-400 font-semibold pb-3 pr-4 w-36">State</th>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
                          <th key={m} className="text-center text-xs text-gray-400 font-semibold pb-3 px-1 w-12">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmap.map((row, ri) => (
                        <motion.tr
                          key={row.state}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ri * 0.04 }}
                        >
                          <td className="text-xs text-gray-700 font-medium pr-4 py-1.5 truncate max-w-[140px]">
                            {row.state}
                          </td>
                          {row.data.map((cell) => {
                            const ratio = heatmapMax > 0 ? cell.value / heatmapMax : 0
                            const bg = ratio === 0 ? '#F8FAFC'
                              : ratio < 0.2 ? '#EFF6FF'
                              : ratio < 0.4 ? '#BFDBFE'
                              : ratio < 0.6 ? '#93C5FD'
                              : ratio < 0.8 ? '#60A5FA'
                              : '#1D4ED8'
                            const textColor = ratio > 0.5 ? '#fff' : '#1E293B'
                            return (
                              <td key={cell.month} className="px-1 py-1.5">
                                <div
                                  className="w-10 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all hover:scale-110 cursor-default border border-gray-100"
                                  style={{ background: bg, color: textColor }}
                                  title={`${row.state} � ${cell.month}: ${fmt(cell.value)}`}
                                >
                                  {cell.value > 0 ? fmt(cell.value) : '�'}
                                </div>
                              </td>
                            )
                          })}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}


          {/* -- Micro Table Section -- */}
          {activeSection === 'table' && !error && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Recent Activity Log</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Last 50 data points � date, enrolments, biometric, demographic, total</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{microTable.length} rows</span>
              </div>

              {microTable.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <BarChart3 className="w-10 h-10 text-gray-200" />
                  <p className="text-gray-400 text-sm">No records for the selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Date', 'Enrolments', 'Biometric', 'Demographic', 'Total'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {microTable.map((row, i) => (
                        <motion.tr
                          key={row.date}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.008 }}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm text-gray-700 font-medium">
                            {fmtDate(row.date)}
                          </td>
                          <td className="px-6 py-3 text-sm text-[#0A2463] font-semibold">
                            {row.enrolments.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-sm text-[#00B4D8] font-semibold">
                            {row.biometric.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-sm text-emerald-600 font-semibold">
                            {row.demographic.toLocaleString()}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-900 font-bold">
                                {row.total.toLocaleString()}
                              </span>
                              <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#0A2463] to-[#00B4D8] rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      (row.total / Math.max(...microTable.map((r) => r.total), 1)) * 100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Footer summary -- */}
        {!error && data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200 text-xs text-gray-400"
          >
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-600">GatiPulse v1.0</span>
              <span>�</span>
              <span>
                {data.meta.stateFilter === 'all' ? 'All States' : data.meta.stateFilter}
                {data.meta.monthFilter !== 'all' && ` � ${MONTHS.find((m) => m.value === data.meta.monthFilter)?.label}`}
                {' � 2025'}
              </span>
              <span>�</span>
              <span>{data.meta.totalRecords.toLocaleString()} records</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-600 font-medium">Data {data.meta.dataLoaded ? 'fully loaded' : 'loading�'}</span>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}

