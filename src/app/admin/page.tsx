'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  RefreshCw,
  Fingerprint,
  Database,
  UserCheck,
  LogOut,
  Shield
} from 'lucide-react'
import { 
  IndiaMap,
  StatusBadge,
  SeverityBadge,
  PulsingDot,
  AnimatedCounter
} from '@/components/ui'
import { formatNumber, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProviderWrapper'

// Types for real data
interface NationalOverview {
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  statesCount: number
  districtsCount: number
  pincodesCount: number
  nationalCoverage: number
  freshnessIndex: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

interface AnomalyData {
  id: string
  state: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState<NationalOverview | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { user, logout } = useAuth()

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch states data
      const statesRes = await fetch('/api/states')
      const statesJson = await statesRes.json()
      
      if (statesJson.success) {
        setOverview(statesJson.data.overview)
      }
      
      // Fetch anomalies
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

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gati-accent/30 border-t-gati-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gati-muted">Loading real Aadhaar data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gati-primary">
            Admin Command Center
          </h1>
          <p className="text-gati-muted">Real-time Aadhaar data from {overview?.statesCount || 0} states</p>
        </div>
      </div>

      {/* Quick Stats from Real Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          className="gati-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gati-muted font-medium uppercase tracking-wider">Total Enrolments</span>
          </div>
          <p className="text-2xl font-bold text-gati-text">
            <AnimatedCounter value={overview?.totalEnrolments || 0} />
          </p>
          <p className="text-xs text-gati-muted mt-1">From {overview?.statesCount || 0} states</p>
        </motion.div>

        <motion.div 
          className="gati-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gati-muted font-medium uppercase tracking-wider">Biometric Updates</span>
          </div>
          <p className="text-2xl font-bold text-gati-text">
            <AnimatedCounter value={overview?.totalBiometricUpdates || 0} />
          </p>
          <p className="text-xs text-gati-muted mt-1">Age 5-17 & 18+</p>
        </motion.div>

        <motion.div 
          className="gati-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs text-gati-muted font-medium uppercase tracking-wider">Demographic Updates</span>
          </div>
          <p className="text-2xl font-bold text-gati-text">
            <AnimatedCounter value={overview?.totalDemographicUpdates || 0} />
          </p>
          <p className="text-xs text-gati-muted mt-1">Address & photo changes</p>
        </motion.div>

        <motion.div 
          className="gati-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-gati-muted font-medium uppercase tracking-wider">Coverage Rate</span>
          </div>
          <p className="text-2xl font-bold text-gati-text">
            {overview?.nationalCoverage.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gati-muted mt-1">Freshness: {overview?.freshnessIndex.toFixed(1) || 0}%</p>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Map & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mini Map */}
          <motion.div 
            className="gati-panel overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gati-text">National Risk Overview</h2>
                <p className="text-sm text-gati-muted">Real-time data from all states</p>
              </div>
              <Link 
                href="/digital-twin"
                className="text-sm text-gati-accent font-medium hover:underline flex items-center gap-1"
              >
                Open Digital Twin <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-80">
              <IndiaMap mode="risk" showLabels={false} interactive={true} />
            </div>
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            className="gati-panel p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-semibold text-gati-text mb-4">State Risk Distribution</h2>
            {overview && (
              <div className="space-y-4">
                <div className="flex h-8 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${(overview.riskDistribution.low / overview.statesCount) * 100}%` }}
                  >
                    {overview.riskDistribution.low > 0 && `${overview.riskDistribution.low}`}
                  </div>
                  <div 
                    className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${(overview.riskDistribution.medium / overview.statesCount) * 100}%` }}
                  >
                    {overview.riskDistribution.medium > 0 && `${overview.riskDistribution.medium}`}
                  </div>
                  <div 
                    className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${(overview.riskDistribution.high / overview.statesCount) * 100}%` }}
                  >
                    {overview.riskDistribution.high > 0 && `${overview.riskDistribution.high}`}
                  </div>
                  <div 
                    className="bg-red-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${(overview.riskDistribution.critical / overview.statesCount) * 100}%` }}
                  >
                    {overview.riskDistribution.critical > 0 && `${overview.riskDistribution.critical}`}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gati-muted">Low: {overview.riskDistribution.low}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-gati-muted">Medium: {overview.riskDistribution.medium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-gati-muted">High: {overview.riskDistribution.high}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gati-muted">Critical: {overview.riskDistribution.critical}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Issues & Activity */}
        <div className="space-y-6">
          {/* AI-Detected Anomalies */}
          <motion.div 
            className="gati-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gati-text">AI-Detected Anomalies</h2>
              </div>
              <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                {anomalies.length} Found
              </span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {anomalies.length > 0 ? anomalies.slice(0, 5).map((anomaly, idx) => (
                <div key={anomaly.id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gati-muted">{anomaly.state}</span>
                    <SeverityBadge severity={anomaly.severity as any} />
                  </div>
                  <p className="text-sm text-gati-text">{anomaly.message}</p>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-gati-muted">No anomalies detected</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/analytics"
                className="text-sm text-gati-accent font-medium hover:underline flex items-center justify-center gap-1"
              >
                View Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Data Summary */}
          <motion.div
            className="gati-panel p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-semibold text-gati-text mb-4">Data Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gati-muted">States/UTs</span>
                <span className="text-sm font-medium text-gati-text">{overview?.statesCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gati-muted">Districts</span>
                <span className="text-sm font-medium text-gati-text">{formatNumber(overview?.districtsCount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gati-muted">Pincodes</span>
                <span className="text-sm font-medium text-gati-text">{formatNumber(overview?.pincodesCount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gati-muted">Coverage</span>
                <span className="text-sm font-medium text-emerald-600">{overview?.nationalCoverage.toFixed(1) || 0}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="gati-panel p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-semibold text-gati-text mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/analytics"
            className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gati-text">View Analytics</span>
          </Link>
          
          <Link 
            href="/digital-twin"
            className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gati-text">India Digital Twin</span>
          </Link>
          
          <Link 
            href="/intelligence"
            className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 transition-colors">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gati-text">AI Intelligence</span>
          </Link>
          
          <Link 
            href="/verification"
            className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-100 transition-colors">
              <Fingerprint className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gati-text">Verification</span>
          </Link>
        </div>
        
        {/* System Status */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gati-muted mb-3">System Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gati-text">Data Pipeline</span>
              <span className="text-xs text-emerald-600 font-medium ml-auto">Live</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gati-text">ML Models</span>
              <span className="text-xs text-emerald-600 font-medium ml-auto">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gati-text">Real Data</span>
              <span className="text-xs text-emerald-600 font-medium ml-auto">Connected</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
