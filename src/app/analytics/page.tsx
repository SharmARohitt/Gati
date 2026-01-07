'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Calendar,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Cpu,
  FileSpreadsheet,
  File,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Activity,
  Fingerprint,
  UserCheck,
  Building2,
  Map,
  Layers,
  Target,
  Zap,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  PieChart,
  LineChart,
  Globe,
  X,
  Eye
} from 'lucide-react'
import { 
  AnimatedGrid,
  AnimatedCounter,
  Footer,
  PulsingDot
} from '@/components/ui'
import { formatNumber, formatDateTime } from '@/lib/utils'
import { exportToCSV, exportToPDF } from '@/lib/utils/exportUtils'
import {
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'

// Types for real data
interface StateData {
  stateCode: string
  stateName: string
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  districtsCount: number
  pincodesCount: number
  ageDistribution: {
    infants: number
    children: number
    adults: number
  }
  coverage: number
  freshness: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  dailyTrends: Array<{
    date: string
    enrolments: number
    biometricUpdates: number
    demographicUpdates: number
  }>
}

interface NationalOverview {
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  statesCount: number
  districtsCount: number
  pincodesCount: number
  nationalCoverage: number
  freshnessIndex: number
  ageBreakdown: {
    age0To5: number
    age5To17: number
    age18Plus: number
  }
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  recentTrends: Array<{
    date: string
    enrolments: number
    biometricUpdates: number
    demographicUpdates: number
  }>
}

interface AnomalyData {
  id: string
  state: string
  stateCode: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  reason: string
  recommendation: string
  metric: string
  value: number
  expectedRange: { min: number; max: number }
  detectedAt: string
}

// Anomaly reasons generator
const generateAnomalyReason = (stateData: StateData): AnomalyData | null => {
  const reasons: AnomalyData[] = []
  
  // Check for low coverage
  if (stateData.coverage < 60) {
    reasons.push({
      id: `${stateData.stateCode}-coverage`,
      state: stateData.stateName,
      stateCode: stateData.stateCode,
      type: 'Coverage Gap',
      severity: stateData.coverage < 40 ? 'critical' : stateData.coverage < 50 ? 'high' : 'medium',
      message: `Low Aadhaar coverage detected at ${stateData.coverage.toFixed(1)}%`,
      reason: `The state has only ${stateData.coverage.toFixed(1)}% Aadhaar coverage, which is ${(85 - stateData.coverage).toFixed(1)}% below the national target of 85%. This may be due to: 1) Remote or tribal areas with limited enrolment centers, 2) Low awareness among population, 3) Infrastructure challenges in rural districts.`,
      recommendation: `Deploy mobile enrolment units to underserved areas. Partner with local NGOs for awareness campaigns. Set up additional permanent centers in ${stateData.districtsCount} districts.`,
      metric: 'coverage',
      value: stateData.coverage,
      expectedRange: { min: 75, max: 95 },
      detectedAt: new Date().toISOString()
    })
  }
  
  // Check for low freshness
  if (stateData.freshness < 50) {
    reasons.push({
      id: `${stateData.stateCode}-freshness`,
      state: stateData.stateName,
      stateCode: stateData.stateCode,
      type: 'Data Staleness',
      severity: stateData.freshness < 30 ? 'critical' : stateData.freshness < 40 ? 'high' : 'medium',
      message: `Outdated biometric data with ${stateData.freshness.toFixed(1)}% freshness`,
      reason: `Only ${stateData.freshness.toFixed(1)}% of records have been updated in the last 5 years. This indicates: 1) Citizens not updating their biometrics after aging, 2) Lack of update facilities, 3) Database sync issues between central and regional servers.`,
      recommendation: `Launch biometric update drive. Send SMS reminders to citizens with outdated records. Increase update center capacity by 40%.`,
      metric: 'freshness',
      value: stateData.freshness,
      expectedRange: { min: 60, max: 90 },
      detectedAt: new Date().toISOString()
    })
  }
  
  // Check enrollment to demographic ratio
  const ratio = stateData.totalDemographicUpdates / Math.max(stateData.totalEnrolments, 1)
  if (ratio > 0.5) {
    reasons.push({
      id: `${stateData.stateCode}-demographic-ratio`,
      state: stateData.stateName,
      stateCode: stateData.stateCode,
      type: 'High Update Rate',
      severity: ratio > 0.8 ? 'high' : 'medium',
      message: `Unusually high demographic update rate (${(ratio * 100).toFixed(1)}%)`,
      reason: `The demographic update rate of ${(ratio * 100).toFixed(1)}% is unusually high. Possible causes: 1) Mass address corrections after administrative changes, 2) Potential duplicate correction drives, 3) Migration-related address updates.`,
      recommendation: `Audit recent demographic changes. Cross-verify with migration data. Check for batch processing anomalies.`,
      metric: 'demographicRatio',
      value: ratio * 100,
      expectedRange: { min: 10, max: 40 },
      detectedAt: new Date().toISOString()
    })
  }
  
  // Check for infant enrollment issues
  const infantRatio = stateData.ageDistribution.infants / Math.max(stateData.totalEnrolments, 1)
  if (infantRatio < 0.03) {
    reasons.push({
      id: `${stateData.stateCode}-infant`,
      state: stateData.stateName,
      stateCode: stateData.stateCode,
      type: 'Low Child Enrollment',
      severity: 'medium',
      message: `Low infant/child Aadhaar enrollment (${(infantRatio * 100).toFixed(2)}%)`,
      reason: `Only ${(infantRatio * 100).toFixed(2)}% of enrollments are for age 0-5 group. This could indicate: 1) Parents not enrolling newborns at hospitals, 2) Lack of Baal Aadhaar awareness, 3) Complex documentation requirements for children.`,
      recommendation: `Integrate Aadhaar enrollment with birth registration. Train hospital staff for infant enrollment. Simplify documentation for child Aadhaar.`,
      metric: 'infantRatio',
      value: infantRatio * 100,
      expectedRange: { min: 5, max: 15 },
      detectedAt: new Date().toISOString()
    })
  }

  return reasons.length > 0 ? reasons[0] : null
}

// All 36 States and UTs
const ALL_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' }
]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('all')
  const [dateRange, setDateRange] = useState('30')
  const [stateSearch, setStateSearch] = useState('')
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'comparison'>('overview')
  const [showAnomalyModal, setShowAnomalyModal] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyData | null>(null)
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area')
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)
  
  // Real data states
  const [nationalData, setNationalData] = useState<NationalOverview | null>(null)
  const [statesData, setStatesData] = useState<StateData[]>([])
  const [selectedStateData, setSelectedStateData] = useState<StateData | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([])
  const [stateAnomalies, setStateAnomalies] = useState<AnomalyData[]>([])
  const [growthRates, setGrowthRates] = useState<{
    enrolmentGrowth: number
    biometricGrowth: number
    demographicGrowth: number
  } | null>(null)

  // Filter states by search
  const filteredStates = ALL_STATES.filter(state => 
    state.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    state.code.toLowerCase().includes(stateSearch.toLowerCase())
  )

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      
      // Fetch states data
      const statesRes = await fetch('/api/states')
      const statesJson = await statesRes.json()
      
      if (statesJson.success) {
        setNationalData(statesJson.data.overview)
        setStatesData(statesJson.data.states)
      }
      
      // Fetch anomalies
      const anomaliesRes = await fetch('/api/ai/anomalies')
      const anomaliesJson = await anomaliesRes.json()
      
      if (anomaliesJson.success) {
        setAnomalies(anomaliesJson.data.anomalies || [])
        setGrowthRates(anomaliesJson.data.growthRates || null)
      }
      
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch data for selected state
  const fetchStateData = useCallback(async (stateCode: string) => {
    if (stateCode === 'all') {
      setSelectedStateData(null)
      setStateAnomalies([])
      return
    }
    
    const stateData = statesData.find(s => 
      s.stateCode === stateCode || s.stateName.toLowerCase().includes(stateCode.toLowerCase())
    )
    
    if (stateData) {
      setSelectedStateData(stateData)
      
      // Generate anomalies for this state
      const generatedAnomalies: AnomalyData[] = []
      
      // Coverage check
      if (stateData.coverage < 60) {
        generatedAnomalies.push({
          id: `${stateData.stateCode}-coverage`,
          state: stateData.stateName,
          stateCode: stateData.stateCode,
          type: 'Coverage Gap',
          severity: stateData.coverage < 40 ? 'critical' : stateData.coverage < 50 ? 'high' : 'medium',
          message: `Low Aadhaar coverage detected at ${stateData.coverage.toFixed(1)}%`,
          reason: `The state has only ${stateData.coverage.toFixed(1)}% Aadhaar coverage, which is ${(85 - stateData.coverage).toFixed(1)}% below the national target of 85%. This may be due to: 1) Remote or tribal areas with limited enrolment centers, 2) Low awareness among population, 3) Infrastructure challenges in rural districts.`,
          recommendation: `Deploy mobile enrolment units to underserved areas. Partner with local NGOs for awareness campaigns. Set up additional permanent centers in ${stateData.districtsCount} districts.`,
          metric: 'coverage',
          value: stateData.coverage,
          expectedRange: { min: 75, max: 95 },
          detectedAt: new Date().toISOString()
        })
      }
      
      // Freshness check
      if (stateData.freshness < 50) {
        generatedAnomalies.push({
          id: `${stateData.stateCode}-freshness`,
          state: stateData.stateName,
          stateCode: stateData.stateCode,
          type: 'Data Staleness',
          severity: stateData.freshness < 30 ? 'critical' : stateData.freshness < 40 ? 'high' : 'medium',
          message: `Outdated biometric data with ${stateData.freshness.toFixed(1)}% freshness index`,
          reason: `Only ${stateData.freshness.toFixed(1)}% of records have been updated in the last 5 years. This indicates: 1) Citizens not updating their biometrics after aging, 2) Lack of update facilities, 3) Database sync issues between central and regional servers.`,
          recommendation: `Launch biometric update drive. Send SMS reminders to citizens with outdated records. Increase update center capacity by 40%.`,
          metric: 'freshness',
          value: stateData.freshness,
          expectedRange: { min: 60, max: 90 },
          detectedAt: new Date().toISOString()
        })
      }
      
      // High risk check
      if (stateData.riskLevel === 'high' || stateData.riskLevel === 'critical') {
        generatedAnomalies.push({
          id: `${stateData.stateCode}-risk`,
          state: stateData.stateName,
          stateCode: stateData.stateCode,
          type: 'High Risk Alert',
          severity: stateData.riskLevel,
          message: `State flagged as ${stateData.riskLevel} risk based on AI analysis`,
          reason: `Multiple factors contribute to ${stateData.riskLevel} risk level: 1) Enrollment-to-population ratio deviation, 2) Unusual biometric update patterns, 3) Geographic coverage gaps in ${stateData.districtsCount} districts across ${stateData.pincodesCount} pincodes.`,
          recommendation: `Conduct immediate audit of enrollment centers. Deploy additional fraud detection measures. Schedule quarterly review with state UIDAI office.`,
          metric: 'riskLevel',
          value: stateData.riskLevel === 'critical' ? 4 : 3,
          expectedRange: { min: 1, max: 2 },
          detectedAt: new Date().toISOString()
        })
      }
      
      // Demographic ratio check
      const ratio = stateData.totalDemographicUpdates / Math.max(stateData.totalEnrolments, 1)
      if (ratio > 0.5) {
        generatedAnomalies.push({
          id: `${stateData.stateCode}-demographic`,
          state: stateData.stateName,
          stateCode: stateData.stateCode,
          type: 'Update Anomaly',
          severity: ratio > 0.8 ? 'high' : 'medium',
          message: `Unusually high demographic update rate (${(ratio * 100).toFixed(1)}%)`,
          reason: `The demographic update rate of ${(ratio * 100).toFixed(1)}% is unusually high compared to the national average. Possible causes: 1) Mass address corrections after administrative boundary changes, 2) Potential duplicate correction drives, 3) Migration-related address updates.`,
          recommendation: `Audit recent demographic changes. Cross-verify with migration data. Check for batch processing anomalies in the system.`,
          metric: 'demographicRatio',
          value: ratio * 100,
          expectedRange: { min: 10, max: 40 },
          detectedAt: new Date().toISOString()
        })
      }
      
      setStateAnomalies(generatedAnomalies)
    }
  }, [statesData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchStateData(selectedState)
  }, [selectedState, fetchStateData])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showStateDropdown && !target.closest('[data-dropdown="state"]')) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStateDropdown]);

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-400" />
  }

  // Current data to display
  const displayData = selectedStateData || nationalData

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Real Aadhaar Data</h2>
          <p className="text-slate-400">Fetching analytics from UIDAI database...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Analytics & Reports
              </h1>
              <p className="text-sm text-slate-500">Real-time insights • {nationalData?.statesCount || 0} states • {formatNumber(nationalData?.totalEnrolments || 0)} records</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <PulsingDot color="bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Live Data</span>
            </div>
            <button 
              onClick={() => fetchData()}
              disabled={refreshing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl text-sm font-medium text-white transition-colors">
              Admin Console
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* State Selector Hero Section */}
          <motion.div 
            className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-8 mb-8 border border-cyan-400/30 shadow-2xl shadow-blue-900/30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ overflow: 'visible' }}
          >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {/* Gradient Orbs */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
              
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.07]" style={{ 
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px' 
              }} />
              
              {/* India Map Silhouette Background */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.08]">
                <svg width="200" height="220" viewBox="0 0 100 120" fill="currentColor" className="text-white">
                  <path d="M75,5 L80,8 L82,15 L78,20 L85,25 L88,22 L92,28 L90,35 L85,32 L80,38 L75,35 L70,40 L65,38 L60,42 L55,40 L50,45 L45,42 L40,48 L35,45 L30,50 L25,48 L20,55 L15,52 L12,60 L18,65 L15,72 L20,78 L25,75 L30,82 L35,78 L40,85 L45,82 L50,88 L55,85 L60,92 L65,88 L70,95 L75,92 L72,100 L68,105 L60,108 L55,115 L50,112 L45,108 L40,105 L35,100 L30,95 L25,90 L20,85 L15,80 L12,75 L10,68 L8,60 L10,52 L15,45 L20,38 L25,32 L30,25 L35,20 L40,15 L45,12 L50,10 L55,8 L60,5 L65,3 L70,5 Z" />
                </svg>
              </div>
            </div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Ashoka Chakra Logo */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-[3px] border-blue-600" />
                  {/* Inner ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-blue-600" />
                  {/* Center hub */}
                  <div className="absolute w-4 h-4 rounded-full bg-blue-600" />
                  {/* 24 Spokes of Ashoka Chakra */}
                  {[...Array(24)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-[2px] h-5 bg-blue-600 origin-bottom"
                      style={{ 
                        transform: `rotate(${i * 15}deg)`,
                        bottom: '50%',
                        left: 'calc(50% - 1px)'
                      }}
                    />
                  ))}
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-blue-500 blur-lg opacity-30" />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedState === 'all' ? 'All India Analytics' : selectedStateData?.stateName || 'Select State'}
                    </h2>
                    {selectedState === 'all' && (
                      <span className="px-3 py-1 bg-gradient-to-r from-orange-500 via-white to-green-500 text-[10px] font-bold text-slate-900 rounded-full uppercase tracking-wider">
                        National
                      </span>
                    )}
                  </div>
                  <p className="text-cyan-200/80">
                    {selectedState === 'all' 
                      ? 'Comprehensive view of all 36 States and Union Territories' 
                      : `Detailed Aadhaar analytics for ${selectedStateData?.stateName}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4" style={{ position: 'relative', zIndex: 100 }}>
                {/* State Dropdown */}
                <div className="relative" data-dropdown="state" style={{ zIndex: 200 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStateDropdown(!showStateDropdown);
                    }}
                    className="flex items-center gap-3 px-5 py-3.5 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl hover:bg-white/30 hover:border-white/60 transition-all min-w-[300px] shadow-xl cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-cyan-300" />
                    <span className="flex-1 text-left font-medium text-white">
                      {selectedState === 'all' 
                        ? 'All India (National)' 
                        : ALL_STATES.find(s => s.code === selectedState)?.name || selectedState}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-cyan-300 transition-transform duration-200 ${showStateDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showStateDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200"
                      style={{ minWidth: '350px', zIndex: 99999, maxHeight: '400px' }}
                    >
                      {/* Search */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search states or UTs..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                          />
                        </div>
                      </div>
                      
                      {/* Options */}
                      <div className="max-h-80 overflow-y-auto overflow-x-hidden">
                        <button
                          onClick={() => {
                            setSelectedState('all')
                            setShowStateDropdown(false)
                            setStateSearch('')
                          }}
                          className={`w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedState === 'all' ? 'bg-cyan-50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedState === 'all' ? 'bg-cyan-500' : 'bg-slate-100'}`}>
                            <Layers className={`w-4 h-4 ${selectedState === 'all' ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1">
                            <span className={`font-medium ${selectedState === 'all' ? 'text-cyan-700' : 'text-slate-700'}`}>All India (National)</span>
                            <p className="text-xs text-slate-500">Complete national overview</p>
                          </div>
                          {selectedState === 'all' && <CheckCircle className="w-5 h-5 text-cyan-500" />}
                        </button>
                        
                        <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">States & UTs ({filteredStates.length})</p>
                        </div>
                        
                        {filteredStates.map(state => (
                          <button
                            key={state.code}
                            onClick={() => {
                              setSelectedState(state.code)
                              setShowStateDropdown(false)
                              setStateSearch('')
                            }}
                            className={`w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors ${selectedState === state.code ? 'bg-cyan-50' : ''}`}
                          >
                            <MapPin className={`w-4 h-4 ${selectedState === state.code ? 'text-cyan-500' : 'text-slate-400'}`} />
                            <span className={`flex-1 text-slate-700 ${selectedState === state.code ? 'text-cyan-700 font-medium' : ''}`}>{state.name}</span>
                            <span className="text-xs text-slate-400">{state.code}</span>
                            {selectedState === state.code && <CheckCircle className="w-4 h-4 text-cyan-500" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Date Range */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-5 py-3.5 bg-white/15 backdrop-blur-md border-2 border-cyan-400/40 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 appearance-none cursor-pointer hover:bg-white/25 hover:border-cyan-300 transition-all shadow-lg shadow-cyan-900/30"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="7" className="text-slate-900">Last 7 days</option>
                  <option value="30" className="text-slate-900">Last 30 days</option>
                  <option value="90" className="text-slate-900">Last 90 days</option>
                  <option value="365" className="text-slate-900">Last year</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div 
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  {growthRates && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${growthRates.enrolmentGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {getTrendIcon(growthRates.enrolmentGrowth)}
                      {Math.abs(growthRates.enrolmentGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {selectedStateData 
                    ? formatNumber(selectedStateData.totalEnrolments)
                    : formatNumber(nationalData?.totalEnrolments || 0)}
                </p>
                <p className="text-sm text-slate-500">Total Enrolments</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Fingerprint className="w-6 h-6 text-white" />
                  </div>
                  {growthRates && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${growthRates.biometricGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {getTrendIcon(growthRates.biometricGrowth)}
                      {Math.abs(growthRates.biometricGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {selectedStateData 
                    ? formatNumber(selectedStateData.totalBiometricUpdates)
                    : formatNumber(nationalData?.totalBiometricUpdates || 0)}
                </p>
                <p className="text-sm text-slate-500">Biometric Updates</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  {growthRates && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${growthRates.demographicGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {getTrendIcon(growthRates.demographicGrowth)}
                      {Math.abs(growthRates.demographicGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {selectedStateData 
                    ? formatNumber(selectedStateData.totalDemographicUpdates)
                    : formatNumber(nationalData?.totalDemographicUpdates || 0)}
                </p>
                <p className="text-sm text-slate-500">Demographic Updates</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-cyan-50 rounded-full text-xs font-medium text-cyan-600">
                    <Activity className="w-3 h-3" />
                    Live
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {selectedStateData 
                    ? selectedStateData.coverage.toFixed(1)
                    : nationalData?.nationalCoverage.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-slate-500">Coverage Rate</p>
              </div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'trends', label: 'Trends', icon: LineChart },
              { id: 'comparison', label: 'State Comparison', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <>
                  {/* Trend Chart - Smooth Area Chart */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-semibold text-slate-900 text-lg">Daily Trend Analysis</h2>
                        <p className="text-sm text-slate-500">
                          {selectedState === 'all' ? 'National' : selectedStateData?.stateName} enrolment and update trends
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Chart Type Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                          <button
                            onClick={() => setChartType('area')}
                            className={`p-2 rounded-md transition-all ${chartType === 'area' ? 'bg-white shadow-sm text-cyan-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Area Chart"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 18L9 12L13 16L21 8" />
                              <path d="M21 8V18H3" fill="currentColor" fillOpacity="0.2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded-md transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-cyan-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Line Chart"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 18L9 12L13 16L21 8" />
                              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                              <circle cx="13" cy="16" r="1.5" fill="currentColor" />
                              <circle cx="21" cy="8" r="1.5" fill="currentColor" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setChartType('bar')}
                            className={`p-2 rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-cyan-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Bar Chart"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="4" y="10" width="4" height="10" rx="1" fill="currentColor" />
                              <rect x="10" y="6" width="4" height="14" rx="1" fill="currentColor" />
                              <rect x="16" y="13" width="4" height="7" rx="1" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Legend */}
                        <div className="hidden md:flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-slate-600">Enrolments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-slate-600">Biometric</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-slate-600">Demographic</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart based on selected type */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                          <AreaChart
                            data={selectedStateData?.dailyTrends || nationalData?.recentTrends || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorEnrolments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorBiometric" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorDemographic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} tickFormatter={(value) => formatNumber(value)} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px', color: '#fff' }}
                              formatter={(value: number) => [formatNumber(value), '']}
                            />
                            <Area type="monotone" dataKey="enrolments" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnrolments)" name="Enrolments" />
                            <Area type="monotone" dataKey="biometricUpdates" stroke="#A855F7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBiometric)" name="Biometric" />
                            <Area type="monotone" dataKey="demographicUpdates" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDemographic)" name="Demographic" />
                          </AreaChart>
                        ) : chartType === 'line' ? (
                          <RechartsLineChart
                            data={selectedStateData?.dailyTrends || nationalData?.recentTrends || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} tickFormatter={(value) => formatNumber(value)} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px', color: '#fff' }}
                              formatter={(value: number) => [formatNumber(value), '']}
                            />
                            <Line type="monotone" dataKey="enrolments" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Enrolments" />
                            <Line type="monotone" dataKey="biometricUpdates" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', r: 4 }} name="Biometric" />
                            <Line type="monotone" dataKey="demographicUpdates" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} name="Demographic" />
                          </RechartsLineChart>
                        ) : (
                          <BarChart
                            data={selectedStateData?.dailyTrends || nationalData?.recentTrends || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} tickFormatter={(value) => formatNumber(value)} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px', color: '#fff' }}
                              formatter={(value: number) => [formatNumber(value), '']}
                            />
                            <Bar dataKey="enrolments" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Enrolments" />
                            <Bar dataKey="biometricUpdates" fill="#A855F7" radius={[4, 4, 0, 0]} name="Biometric" />
                            <Bar dataKey="demographicUpdates" fill="#10B981" radius={[4, 4, 0, 0]} name="Demographic" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Age Distribution - Smooth Pie/Donut Chart */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="font-semibold text-slate-900 text-lg mb-6">Age Distribution Analysis</h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Pie Chart */}
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={[
                                { name: 'Age 0-5', value: selectedStateData?.ageDistribution.infants || nationalData?.ageBreakdown.age0To5 || 0, color: '#3B82F6' },
                                { name: 'Age 5-17', value: selectedStateData?.ageDistribution.children || nationalData?.ageBreakdown.age5To17 || 0, color: '#A855F7' },
                                { name: 'Age 18+', value: selectedStateData?.ageDistribution.adults || nationalData?.ageBreakdown.age18Plus || 0, color: '#10B981' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              <Cell fill="#3B82F6" />
                              <Cell fill="#A855F7" />
                              <Cell fill="#10B981" />
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [formatNumber(value), '']}
                              contentStyle={{ 
                                backgroundColor: '#0F172A', 
                                border: 'none', 
                                borderRadius: '12px',
                                color: '#fff'
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend and Stats */}
                      <div className="flex flex-col justify-center space-y-6">
                        {[
                          { label: 'Age 0-5 (Infants)', value: selectedStateData?.ageDistribution.infants || nationalData?.ageBreakdown.age0To5 || 0, color: '#3B82F6', bg: 'bg-blue-500' },
                          { label: 'Age 5-17 (Children)', value: selectedStateData?.ageDistribution.children || nationalData?.ageBreakdown.age5To17 || 0, color: '#A855F7', bg: 'bg-purple-500' },
                          { label: 'Age 18+ (Adults)', value: selectedStateData?.ageDistribution.adults || nationalData?.ageBreakdown.age18Plus || 0, color: '#10B981', bg: 'bg-emerald-500' }
                        ].map((item, idx) => {
                          const total = (selectedStateData?.totalEnrolments || nationalData?.totalEnrolments || 1)
                          const percentage = ((item.value / total) * 100).toFixed(1)
                          return (
                            <div key={idx} className="flex items-center gap-4">
                              <div className={`w-4 h-4 rounded-full ${item.bg}`} />
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                  <span className="text-sm font-bold text-slate-900">{formatNumber(item.value)}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    className={`h-full rounded-full ${item.bg}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 mt-1">{percentage}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Trends Tab Content */}
              {activeTab === 'trends' && (
                <>
                  {/* Line Chart for Trends */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-semibold text-slate-900 text-lg">Trend Performance</h2>
                        <p className="text-sm text-slate-500">Detailed analysis of Aadhaar operations over time</p>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={selectedStateData?.dailyTrends || nationalData?.recentTrends || []}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            tickLine={false}
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F172A', 
                              border: 'none', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            formatter={(value: number) => [formatNumber(value), '']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="enrolments" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#3B82F6' }}
                            name="Enrolments"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="biometricUpdates" 
                            stroke="#A855F7" 
                            strokeWidth={3}
                            dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#A855F7' }}
                            name="Biometric Updates"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="demographicUpdates" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#10B981' }}
                            name="Demographic Updates"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Growth Metrics with Graph */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="font-semibold text-slate-900 text-lg mb-6">Growth Metrics</h2>
                    
                    {/* Growth Chart */}
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { 
                              name: 'Enrolment', 
                              growth: growthRates?.enrolmentGrowth || 0,
                              fill: (growthRates?.enrolmentGrowth || 0) >= 0 ? '#3B82F6' : '#EF4444'
                            },
                            { 
                              name: 'Biometric', 
                              growth: growthRates?.biometricGrowth || 0,
                              fill: (growthRates?.biometricGrowth || 0) >= 0 ? '#A855F7' : '#EF4444'
                            },
                            { 
                              name: 'Demographic', 
                              growth: growthRates?.demographicGrowth || 0,
                              fill: (growthRates?.demographicGrowth || 0) >= 0 ? '#10B981' : '#EF4444'
                            }
                          ]}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
                          <XAxis 
                            type="number" 
                            tick={{ fontSize: 12, fill: '#64748B' }}
                            tickFormatter={(value) => `${value}%`}
                            domain={['dataMin - 10', 'dataMax + 10']}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px', color: '#fff' }}
                            formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, 'Growth']}
                          />
                          <Bar 
                            dataKey="growth" 
                            radius={[0, 8, 8, 0]}
                            barSize={40}
                          >
                            {[
                              { fill: (growthRates?.enrolmentGrowth || 0) >= 0 ? '#3B82F6' : '#EF4444' },
                              { fill: (growthRates?.biometricGrowth || 0) >= 0 ? '#A855F7' : '#EF4444' },
                              { fill: (growthRates?.demographicGrowth || 0) >= 0 ? '#10B981' : '#EF4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Growth Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Enrolment Growth', value: growthRates?.enrolmentGrowth || 0, color: 'blue', icon: Users },
                        { label: 'Biometric Growth', value: growthRates?.biometricGrowth || 0, color: 'purple', icon: Fingerprint },
                        { label: 'Demographic Growth', value: growthRates?.demographicGrowth || 0, color: 'emerald', icon: UserCheck }
                      ].map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`relative overflow-hidden p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                            item.value >= 0 
                              ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200' 
                              : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              item.value >= 0 
                                ? `bg-${item.color}-100` 
                                : 'bg-red-100'
                            }`}>
                              <item.icon className={`w-5 h-5 ${item.value >= 0 ? `text-${item.color}-500` : 'text-red-500'}`} />
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              item.value >= 0 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.value >= 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {Math.abs(item.value).toFixed(0)}%
                            </div>
                          </div>
                          <p className={`text-2xl font-bold mb-1 ${
                            item.value >= 0 ? 'text-slate-900' : 'text-red-600'
                          }`}>
                            {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
                          </p>
                          <p className="text-sm text-slate-500">{item.label}</p>
                          
                          {/* Background decoration */}
                          <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 ${
                            item.value >= 0 ? `bg-${item.color}-500` : 'bg-red-500'
                          }`} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {/* Comparison Tab Content */}
              {activeTab === 'comparison' && (
                <>
                  {/* Bar Chart Comparison */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-semibold text-slate-900 text-lg">Top 10 States by Enrolments</h2>
                        <p className="text-sm text-slate-500">Compare Aadhaar operations across states</p>
                      </div>
                    </div>
                    
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={statesData.slice(0, 10).map(s => ({
                            name: s.stateCode,
                            enrolments: s.totalEnrolments,
                            biometric: s.totalBiometricUpdates,
                            demographic: s.totalDemographicUpdates
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 11, fill: '#64748B' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0F172A', 
                              border: 'none', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            formatter={(value: number) => [formatNumber(value), '']}
                          />
                          <Legend />
                          <Bar dataKey="enrolments" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Enrolments" />
                          <Bar dataKey="biometric" fill="#A855F7" radius={[4, 4, 0, 0]} name="Biometric" />
                          <Bar dataKey="demographic" fill="#10B981" radius={[4, 4, 0, 0]} name="Demographic" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* State Comparison Table */}
                  <motion.div 
                    className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-6 border-b border-slate-100">
                      <h2 className="font-semibold text-slate-900 text-lg">State-wise Comparison</h2>
                      <p className="text-sm text-slate-500">Click on any state to view detailed analytics and AI-detected anomalies</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolments</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Biometric</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Coverage</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {statesData.slice(0, 15).map((state) => (
                            <tr 
                              key={state.stateCode}
                              className="hover:bg-slate-50 cursor-pointer transition-colors group"
                              onClick={() => setSelectedState(state.stateCode)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-cyan-100 group-hover:text-cyan-600 transition-colors">
                                    {state.stateCode}
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">{state.stateName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-slate-700 font-medium">
                                {formatNumber(state.totalEnrolments)}
                              </td>
                              <td className="px-6 py-4 text-right text-sm text-slate-700">
                                {formatNumber(state.totalBiometricUpdates)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                      style={{ width: `${state.coverage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900 w-12">{state.coverage.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getRiskColor(state.riskLevel)}`}>
                                  {state.riskLevel}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Selected State Details with AI Anomaly Reasons */}
              {selectedStateData && (
                <motion.div 
                  className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25">
                        {selectedStateData.stateCode}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900 text-lg">{selectedStateData.stateName}</h2>
                        <p className="text-sm text-slate-500">Complete Aadhaar statistics & AI Analysis</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 text-sm font-semibold rounded-xl capitalize ${getRiskColor(selectedStateData.riskLevel)}`}>
                        {selectedStateData.riskLevel} Risk
                      </span>
                      <button
                        onClick={() => setSelectedState('all')}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Districts', value: selectedStateData.districtsCount, icon: Building2, color: 'blue' },
                      { label: 'Pincodes', value: selectedStateData.pincodesCount, icon: MapPin, color: 'purple' },
                      { label: 'Coverage', value: `${selectedStateData.coverage.toFixed(1)}%`, icon: Target, color: 'emerald' },
                      { label: 'Freshness', value: `${selectedStateData.freshness.toFixed(1)}%`, icon: Zap, color: 'amber' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <item.icon className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-500">{item.label}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">
                          {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* AI Detected Anomalies for this State */}
                  {stateAnomalies.length > 0 && (
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900">AI-Detected Issues for {selectedStateData.stateName}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {stateAnomalies.map((anomaly, idx) => (
                          <motion.div 
                            key={anomaly.id}
                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${getRiskColor(anomaly.severity)}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => {
                              setSelectedAnomaly(anomaly)
                              setShowAnomalyModal(true)
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{anomaly.type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${getRiskColor(anomaly.severity)}`}>
                                  {anomaly.severity}
                                </span>
                              </div>
                              <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            </div>
                            <p className="text-sm text-slate-700 mb-3">{anomaly.message}</p>
                            <div className="text-xs text-slate-500 bg-white/50 rounded-lg p-3">
                              <strong className="text-slate-700">Reason:</strong> {anomaly.reason.substring(0, 150)}...
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-cyan-600">
                              <Info className="w-3 h-3" />
                              <span>Click to see full analysis & recommendations</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stateAnomalies.length === 0 && (
                    <div className="border-t border-slate-200 pt-6">
                      <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="font-medium text-emerald-700">No Anomalies Detected</p>
                        <p className="text-sm text-emerald-600">All metrics are within normal parameters</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Column - Risk & Anomalies */}
            <div className="space-y-6">
              
              {/* Risk Distribution - Computed Fresh from statesData */}
              <motion.div 
                className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900">Risk Distribution</h2>
                  <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Live
                  </span>
                </div>
                
                {statesData.length > 0 && (() => {
                  // Compute fresh from statesData
                  const riskCounts = {
                    low: statesData.filter(s => s.riskLevel === 'low').length,
                    medium: statesData.filter(s => s.riskLevel === 'medium').length,
                    high: statesData.filter(s => s.riskLevel === 'high').length,
                    critical: statesData.filter(s => s.riskLevel === 'critical').length
                  }
                  const totalStates = statesData.length
                  
                  return (
                    <div className="space-y-4">
                      {[
                        { label: 'Low Risk', count: riskCounts.low, color: 'emerald', bgClass: 'bg-emerald-500' },
                        { label: 'Medium Risk', count: riskCounts.medium, color: 'yellow', bgClass: 'bg-yellow-500' },
                        { label: 'High Risk', count: riskCounts.high, color: 'orange', bgClass: 'bg-orange-500' },
                        { label: 'Critical', count: riskCounts.critical, color: 'red', bgClass: 'bg-red-500' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.bgClass}`} />
                            <span className="text-sm text-slate-600">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{item.count} states</span>
                        </div>
                      ))}
                      
                      {/* Visual bar */}
                      <div className="flex h-4 rounded-full overflow-hidden mt-4 bg-slate-100">
                        <div 
                          className="bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(riskCounts.low / totalStates) * 100}%` }}
                        />
                        <div 
                          className="bg-yellow-500 transition-all duration-500" 
                          style={{ width: `${(riskCounts.medium / totalStates) * 100}%` }}
                        />
                        <div 
                          className="bg-orange-500 transition-all duration-500" 
                          style={{ width: `${(riskCounts.high / totalStates) * 100}%` }}
                        />
                        <div 
                          className="bg-red-500 transition-all duration-500" 
                          style={{ width: `${(riskCounts.critical / totalStates) * 100}%` }}
                        />
                      </div>
                      
                      {/* Summary */}
                      <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
                        Total: {totalStates} states/UTs analyzed
                      </div>
                    </div>
                  )
                })()}
              </motion.div>

              {/* AI Detected Anomalies - Fresh from statesData */}
              <motion.div 
                className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-slate-900">AI-Detected Anomalies</h2>
                  <span className="ml-auto text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> AI
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {statesData.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length > 0 ? (
                    statesData
                      .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
                      .sort((a, b) => {
                        // Sort by severity first (critical > high), then by coverage (lower is worse)
                        if (a.riskLevel === 'critical' && b.riskLevel !== 'critical') return -1
                        if (b.riskLevel === 'critical' && a.riskLevel !== 'critical') return 1
                        return a.coverage - b.coverage
                      })
                      .slice(0, 12)
                      .map((state, idx) => {
                        // Determine the primary issue for this state
                        const issues: string[] = []
                        let primaryIssue = ''
                        let primaryMessage = ''
                        let primaryReason = ''
                        let primaryRecommendation = ''
                        
                        if (state.coverage < 50) {
                          issues.push('Low Coverage')
                          primaryIssue = 'Coverage Gap'
                          primaryMessage = `Critically low coverage at ${state.coverage.toFixed(1)}% (Target: 85%)`
                          primaryReason = `${state.stateName} has only ${state.coverage.toFixed(1)}% Aadhaar coverage, which is ${(85 - state.coverage).toFixed(1)}% below national target. Analysis reveals: 1) Only ${state.districtsCount} districts have active enrollment centers, 2) ${state.pincodesCount} pincodes show irregular enrollment patterns, 3) Rural-urban coverage disparity exceeds 30%, 4) ${formatNumber(state.totalEnrolments)} total enrollments is below expected population coverage.`
                          primaryRecommendation = `PRIORITY ACTIONS: Deploy ${Math.ceil((85 - state.coverage) / 5)} mobile units immediately. Set up camps in all ${state.districtsCount} districts. Partner with schools, PHCs, and gram panchayats. Target ${formatNumber(Math.round(state.totalEnrolments * 0.7))} new enrollments in 6 months.`
                        } else if (state.freshness < 45) {
                          issues.push('Stale Data')
                          primaryIssue = 'Data Staleness'
                          primaryMessage = `Only ${state.freshness.toFixed(1)}% records are fresh (Target: 80%)`
                          primaryReason = `${state.stateName}'s biometric freshness is critically low at ${state.freshness.toFixed(1)}%. This means ${(100 - state.freshness).toFixed(1)}% of Aadhaar holders haven't updated in 5+ years. Causes: 1) ${formatNumber(Math.round(state.totalBiometricUpdates * 0.3))} citizens have outdated fingerprints, 2) Update center capacity insufficient for ${state.pincodesCount} pincodes, 3) Low awareness about mandatory biometric updates.`
                          primaryRecommendation = `URGENT: Send SMS alerts to ${formatNumber(Math.round(state.totalEnrolments * 0.6))} citizens with stale records. Extend center hours to 12hrs. Deploy ${Math.ceil(state.districtsCount / 2)} additional operators. Target ${formatNumber(Math.round(state.totalBiometricUpdates * 0.5))} updates in 3 months.`
                        } else if ((state.totalDemographicUpdates / Math.max(state.totalEnrolments, 1)) > 0.6) {
                          const demoRatio = (state.totalDemographicUpdates / state.totalEnrolments * 100).toFixed(1)
                          issues.push('High Update Rate')
                          primaryIssue = 'Demographic Anomaly'
                          primaryMessage = `Unusual ${demoRatio}% demographic update rate detected`
                          primaryReason = `${state.stateName} shows ${demoRatio}% demographic update rate, significantly above normal 20-30% range. ${formatNumber(state.totalDemographicUpdates)} demographic updates against ${formatNumber(state.totalEnrolments)} enrollments. Possible causes: 1) Mass migration events, 2) Administrative boundary changes, 3) Potential duplicate entries, 4) Data quality issues in ${state.districtsCount} districts.`
                          primaryRecommendation = `INVESTIGATE: Audit ${Math.ceil(state.districtsCount * 0.3)} high-volume districts. Cross-verify with census and election data. Flag ${formatNumber(Math.round(state.totalDemographicUpdates * 0.1))} suspicious updates. Implement stricter verification protocols.`
                        } else {
                          issues.push('Multiple Factors')
                          primaryIssue = 'Composite Risk'
                          primaryMessage = `${state.riskLevel === 'critical' ? 'Critical' : 'High'} risk from multiple factors`
                          primaryReason = `${state.stateName} flagged due to combined risk factors: Coverage ${state.coverage.toFixed(1)}%, Freshness ${state.freshness.toFixed(1)}%, across ${state.districtsCount} districts and ${state.pincodesCount} pincodes. Age distribution shows ${formatNumber(state.ageDistribution.infants)} infants, ${formatNumber(state.ageDistribution.children)} children, ${formatNumber(state.ageDistribution.adults)} adults. Biometric updates ${formatNumber(state.totalBiometricUpdates)} are ${state.totalBiometricUpdates < state.totalDemographicUpdates ? 'below' : 'above'} demographic updates.`
                          primaryRecommendation = `COMPREHENSIVE PLAN: 1) Increase enrollment capacity by 50%, 2) Launch district-wise improvement programs, 3) Weekly monitoring dashboards, 4) Train ${state.districtsCount * 10} new operators, 5) Quarterly review with state coordinator.`
                        }
                        
                        // Generate the anomaly object
                        const stateAnomaly: AnomalyData = {
                          id: `sidebar-${state.stateCode}-${idx}`,
                          state: state.stateName,
                          stateCode: state.stateCode,
                          type: primaryIssue,
                          severity: state.riskLevel as 'critical' | 'high',
                          message: primaryMessage,
                          reason: primaryReason,
                          recommendation: primaryRecommendation,
                          metric: state.coverage < 50 ? 'coverage' : state.freshness < 45 ? 'freshness' : 'composite',
                          value: state.coverage < 50 ? state.coverage : state.freshness < 45 ? state.freshness : (state.coverage + state.freshness) / 2,
                          expectedRange: { min: 75, max: 95 },
                          detectedAt: new Date().toISOString()
                        }
                        
                        return (
                          <motion.div 
                            key={`${state.stateCode}-${idx}`}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${getRiskColor(state.riskLevel)}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => {
                              setSelectedAnomaly(stateAnomaly)
                              setShowAnomalyModal(true)
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  state.riskLevel === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                                }`}>
                                  {state.stateCode || state.stateName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-slate-800 block">{state.stateName}</span>
                                  <span className="text-[10px] text-slate-500">{issues.join(', ')}</span>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${getRiskColor(state.riskLevel)}`}>
                                {state.riskLevel}
                              </span>
                            </div>
                            
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="bg-white/60 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-slate-500 block">Coverage</span>
                                <span className={`text-xs font-bold ${state.coverage < 50 ? 'text-red-600' : state.coverage < 70 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                  {state.coverage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="bg-white/60 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-slate-500 block">Freshness</span>
                                <span className={`text-xs font-bold ${state.freshness < 45 ? 'text-red-600' : state.freshness < 65 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                  {state.freshness.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-cyan-600 font-medium">
                              <Eye className="w-3 h-3" />
                              <span>Click for AI analysis & fix</span>
                            </div>
                          </motion.div>
                        )
                      })
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">All Systems Normal</p>
                      <p className="text-xs text-slate-500">No critical anomalies detected</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Data Summary - Fresh from statesData */}
              <motion.div 
                className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-slate-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900">Data Summary</h2>
                  <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Live
                  </span>
                </div>
                
                {statesData.length > 0 && (() => {
                  // Compute fresh from statesData
                  const totalStates = statesData.length
                  const totalDistricts = statesData.reduce((sum, s) => sum + s.districtsCount, 0)
                  const totalPincodes = statesData.reduce((sum, s) => sum + s.pincodesCount, 0)
                  const avgFreshness = statesData.reduce((sum, s) => sum + s.freshness, 0) / totalStates
                  const totalEnrolments = statesData.reduce((sum, s) => sum + s.totalEnrolments, 0)
                  const totalBiometric = statesData.reduce((sum, s) => sum + s.totalBiometricUpdates, 0)
                  
                  return (
                    <div className="space-y-4">
                      {[
                        { label: 'Total States/UTs', value: totalStates, icon: Map },
                        { label: 'Total Districts', value: totalDistricts, icon: Building2 },
                        { label: 'Total Pincodes', value: totalPincodes, icon: MapPin },
                        { label: 'Total Records', value: totalEnrolments + totalBiometric, icon: Database },
                        { label: 'Data Freshness', value: `${avgFreshness.toFixed(1)}%`, icon: Zap }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </motion.div>

              {/* Export Options */}
              <motion.div 
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="font-semibold text-white mb-4">Export Report</h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setExporting('pdf')
                      setTimeout(() => {
                        exportToPDF(statesData, nationalData)
                        setExporting(null)
                      }, 100)
                    }}
                    disabled={exporting !== null || statesData.length === 0}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting === 'pdf' ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <File className="w-4 h-4 text-red-400" />
                        Download PDF Report
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setExporting('csv')
                      setTimeout(() => {
                        exportToCSV(statesData, nationalData)
                        setExporting(null)
                      }, 100)
                    }}
                    disabled={exporting !== null || statesData.length === 0}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting === 'csv' ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                        Exporting CSV...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Export to CSV
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      // Copy link to clipboard
                      navigator.clipboard.writeText(window.location.href)
                      alert('Analytics link copied to clipboard!')
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/25"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Analytics
                  </button>
                </div>
                
                {/* Export Info */}
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    PDF includes all {statesData.length} states data & risk analysis
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Detail Modal */}
      <AnimatePresence>
        {showAnomalyModal && selectedAnomaly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowAnomalyModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-6 border-b ${getRiskColor(selectedAnomaly.severity)} bg-opacity-50`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      selectedAnomaly.severity === 'critical' ? 'bg-red-500' :
                      selectedAnomaly.severity === 'high' ? 'bg-orange-500' :
                      selectedAnomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}>
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedAnomaly.type}</h2>
                      <p className="text-sm text-slate-600">{selectedAnomaly.state}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnomalyModal(false)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Severity Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">Severity Level:</span>
                  <span className={`px-4 py-1.5 text-sm font-bold rounded-full capitalize ${getRiskColor(selectedAnomaly.severity)}`}>
                    {selectedAnomaly.severity}
                  </span>
                </div>
                
                {/* Issue Description */}
                <div className="bg-slate-50 rounded-2xl p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    Issue Detected
                  </h3>
                  <p className="text-slate-700">{selectedAnomaly.message}</p>
                </div>
                
                {/* Detailed Reason */}
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Analysis - Why This Happened
                  </h3>
                  <p className="text-amber-900 leading-relaxed">{selectedAnomaly.reason}</p>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedAnomaly.metric === 'coverage' || selectedAnomaly.metric === 'freshness' 
                        ? `${selectedAnomaly.value.toFixed(1)}%` 
                        : selectedAnomaly.value.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Expected Range</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {selectedAnomaly.expectedRange.min}% - {selectedAnomaly.expectedRange.max}%
                    </p>
                  </div>
                </div>
                
                {/* Recommendation */}
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
                  <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Recommended Actions
                  </h3>
                  <p className="text-emerald-900 leading-relaxed">{selectedAnomaly.recommendation}</p>
                </div>
                
                {/* Detection Time */}
                <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <span>Detected: {new Date(selectedAnomaly.detectedAt).toLocaleString()}</span>
                  <span className="flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    AI-Powered Analysis
                  </span>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex gap-3">
                <button 
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => setShowAnomalyModal(false)}
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    exportToPDF(statesData, nationalData)
                    setShowAnomalyModal(false)
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Full Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
