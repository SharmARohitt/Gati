'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  TrendingUp, AlertTriangle, Users, MapPin, ArrowRight,
  CheckCircle, Activity, RefreshCw, Fingerprint, Database,
  UserCheck, Shield, BarChart3, Zap, Clock, Eye,
  ChevronRight, AlertCircle, Globe
} from 'lucide-react'
import { IndiaMap, SeverityBadge, AnimatedCounter } from '@/components/ui'
import { formatLargeNumber, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProviderWrapper'

interface NationalOverview {
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  statesCount: number
  districtsCount: number
  pincodesCount: number
  nationalCoverage: number
  freshnessIndex: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
}

interface AnomalyData {
  id: string
  state: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-600', label: 'Critical' },
  high:     { bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500', text: 'text-orange-600', label: 'High' },
  medium:   { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-600', label: 'Medium' },
  low:      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Low' },
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [overview, setOverview] = useState<NationalOverview | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([])
  const [statesData, setStatesData] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { user } = useAuth()

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const statesRes = await fetch('/api/states')
      const statesJson = await statesRes.json()
      if (statesJson.success) {
        setOverview(statesJson.data.overview)
        setStatesData(statesJson.data.states || [])
        setDataLoading(!!statesJson.loading)

        // If data is still loading on server, poll again in 5s
        if (statesJson.loading) {
          setTimeout(() => fetchData(), 5000)
          setLoading(false)
          setRefreshing(false)
          return
        }
      }
      // Only fetch anomalies once states are fully loaded
      const anomaliesRes = await fetch('/api/ai/anomalies')
      const anomaliesJson = await anomaliesRes.json()
      if (anomaliesJson.success) {
        setAnomalies(anomaliesJson.data.anomalies || [])
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gati-bg, #F0F4F8)' }}>
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 border-4 border-[#0A2463]/20 border-t-[#0A2463] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold" style={{ color: 'var(--gati-primary, #0A2463)' }}>Loading Aadhaar Intelligence...</p>
          <p className="text-sm mt-2" style={{ color: 'var(--gati-muted)' }}>Processing 5M+ real CSV records</p>
          <p className="text-xs mt-1" style={{ color: 'var(--gati-muted)' }}>First load takes ~30–60s · cached after that</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-600">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Data loads once and stays in memory</span>
          </div>
        </div>
      </div>
    )
  }

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const highCount = anomalies.filter(a => a.severity === 'high').length

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: 'var(--gati-bg, #F0F4F8)' }}>

      {/* Data loading banner */}
      {dataLoading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-amber-800 font-medium">Processing CSV data in background — numbers will update automatically in a few seconds.</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-[#0A2463] rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--gati-primary, #0A2463)' }}>Command Center</h1>
          </div>
          <p className="text-sm pl-3" style={{ color: 'var(--gati-muted)' }}>
            Real-time Aadhaar intelligence · {overview?.statesCount || 0} states · Last updated {formatDateTime(lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(criticalCount > 0 || highCount > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-red-600">
                {criticalCount} Critical · {highCount} High
              </span>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all shadow-sm hover:opacity-80"
            style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)', color: 'var(--gati-text)' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--gati-muted)' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Enrolments',
            value: overview?.totalEnrolments || 0,
            sub: `Across ${overview?.statesCount || 0} states`,
            icon: Users,
            color: 'from-[#0A2463] to-[#1E5AA8]',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
            delay: 0,
          },
          {
            label: 'Biometric Updates',
            value: overview?.totalBiometricUpdates || 0,
            sub: 'Age 5–17 & 18+',
            icon: Fingerprint,
            color: 'from-purple-600 to-purple-800',
            iconBg: 'bg-purple-500/10',
            iconColor: 'text-purple-600',
            delay: 0.05,
          },
          {
            label: 'Demographic Updates',
            value: overview?.totalDemographicUpdates || 0,
            sub: 'Address & photo changes',
            icon: UserCheck,
            color: 'from-emerald-600 to-emerald-800',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-600',
            delay: 0.1,
          },
          {
            label: 'National Coverage',
            value: overview?.nationalCoverage || 0,
            isPercent: true,
            sub: `Freshness: ${overview?.freshnessIndex?.toFixed(1) || 0}%`,
            icon: Globe,
            color: 'from-amber-500 to-amber-700',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-600',
            delay: 0.15,
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay }}
              className="rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow"
              style={{ background: 'var(--gati-card, #fff)', borderColor: 'var(--gati-border, #e5e7eb)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-600">LIVE</span>
                </div>
              </div>
              <div className="mb-1">
                {card.isPercent ? (
                  <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gati-text)' }}>
                    {card.value.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--gati-text)' }}>
                    {formatLargeNumber(card.value)}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--gati-text)' }}>{card.label}</p>
              <p className="text-xs" style={{ color: 'var(--gati-muted)' }}>{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Left: Map + Risk Bar */}
        <div className="xl:col-span-2 space-y-5">

          {/* Map Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)' }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--gati-border)' }}>
              <div>
                <h2 className="font-bold text-sm" style={{ color: 'var(--gati-text)' }}>National Risk Overview</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gati-muted)' }}>Real-time risk classification from CSV data</p>
              </div>
              <Link
                href="/digital-twin"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1E5AA8] hover:text-[#0A2463] transition-colors"
              >
                Open Digital Twin <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="h-[320px]">
              <IndiaMap mode="risk" showLabels={false} interactive={true} statesData={statesData} />
            </div>
          </motion.div>

          {/* Risk Distribution Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border shadow-sm p-5"
            style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm" style={{ color: 'var(--gati-text)' }}>State Risk Distribution</h2>
              <span className="text-xs" style={{ color: 'var(--gati-muted)' }}>{overview?.statesCount || 0} states total</span>
            </div>
            {overview && (
              <>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
                  {[
                    { count: overview.riskDistribution.low, color: 'bg-emerald-500' },
                    { count: overview.riskDistribution.medium, color: 'bg-amber-400' },
                    { count: overview.riskDistribution.high, color: 'bg-orange-500' },
                    { count: overview.riskDistribution.critical, color: 'bg-red-500' },
                  ].map((seg, i) => (
                    <motion.div
                      key={i}
                      className={`${seg.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(seg.count / overview.statesCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Low Risk', count: overview.riskDistribution.low, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Medium', count: overview.riskDistribution.medium, color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'High', count: overview.riskDistribution.high, color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
                    { label: 'Critical', count: overview.riskDistribution.critical, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
                  ].map(seg => (
                    <div key={seg.label} className={`${seg.bg} rounded-xl p-3 text-center`}>
                      <div className={`text-2xl font-bold ${seg.text}`}>{seg.count}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${seg.color}`} />
                        <span className="text-[10px] font-medium text-gray-500">{seg.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Right: Anomalies + Data Summary + Quick Actions */}
        <div className="space-y-5">

          {/* Anomalies */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)' }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--gati-border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="font-bold text-sm" style={{ color: 'var(--gati-text)' }}>AI Anomalies</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                anomalies.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {anomalies.length} detected
              </span>
            </div>

            <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: 'var(--gati-border)' }}>
              {anomalies.length > 0 ? anomalies.slice(0, 6).map((a, idx) => {
                const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low
                return (
                  <div key={a.id || idx} className="px-5 py-3 transition-colors hover:opacity-80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate max-w-[140px]" style={{ color: 'var(--gati-text)' }}>{a.state}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--gati-muted)' }}>{a.message}</p>
                  </div>
                )
              }) : (
                <div className="py-10 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium" style={{ color: 'var(--gati-muted)' }}>All clear — no anomalies</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--gati-border)', background: 'var(--gati-bg)' }}>
              <Link href="/analytics" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1E5AA8] hover:text-[#0A2463] transition-colors">
                Full Analytics Report <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Data Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border shadow-sm p-5"
            style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)' }}
          >
            <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--gati-text)' }}>Data Coverage</h2>
            <div className="space-y-3">
              {[
                { label: 'States / UTs', value: overview?.statesCount || 0, raw: true },
                { label: 'Districts', value: overview?.districtsCount || 0 },
                { label: 'Pincodes', value: overview?.pincodesCount || 0 },
                { label: 'Freshness Index', value: `${overview?.freshnessIndex?.toFixed(1) || 0}%`, raw: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'var(--gati-border)' }}>
                  <span className="text-xs" style={{ color: 'var(--gati-muted)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--gati-text)' }}>
                    {item.raw ? item.value : formatLargeNumber(item.value as number)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border shadow-sm p-5"
        style={{ background: 'var(--gati-card)', borderColor: 'var(--gati-border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-sm" style={{ color: 'var(--gati-text)' }}>Quick Navigation</h2>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gati-muted)' }}>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/analytics', label: 'Analytics & Reports', sub: 'Trends & insights', icon: BarChart3, color: 'from-emerald-500 to-emerald-600' },
            { href: '/digital-twin', label: 'India Digital Twin', sub: 'Interactive map', icon: MapPin, color: 'from-blue-500 to-blue-600' },
            { href: '/intelligence', label: 'AI Intelligence', sub: 'ML predictions', icon: Zap, color: 'from-purple-500 to-purple-600' },
            { href: '/verification', label: 'Verification', sub: 'Pattern analysis', icon: Shield, color: 'from-amber-500 to-amber-600' },
            { href: '/field-operations', label: 'Field Operations', sub: 'Officer tracking', icon: Users, color: 'from-cyan-500 to-cyan-600' },
            { href: '/audit', label: 'Audit Trail', sub: 'Blockchain log', icon: Eye, color: 'from-slate-500 to-slate-600' },
            { href: '/admin/issues', label: 'Issues & Tasks', sub: 'Active issues', icon: AlertTriangle, color: 'from-red-500 to-red-600' },
            { href: '/settings', label: 'Settings', sub: 'Configuration', icon: Activity, color: 'from-gray-500 to-gray-600' },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-[#1E5AA8]/40"
                style={{ borderColor: 'var(--gati-border)', background: 'var(--gati-bg)' }}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-[#0A2463] transition-colors" style={{ color: 'var(--gati-text)' }}>{item.label}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--gati-muted)' }}>{item.sub}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
