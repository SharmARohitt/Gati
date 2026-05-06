'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, Layers, Play, Pause,
  ChevronLeft, ChevronRight, TrendingUp, Users,
  RefreshCw, AlertTriangle, Info, Download, Loader2,
  Brain, MessageSquare
} from 'lucide-react'
import {
  IndiaMap,
  AnimatedGrid,
  ProgressBar,
} from '@/components/ui'
import { timelineData } from '@/lib/data'
import { formatIndianNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type MapMode = 'health' | 'saturation' | 'freshness' | 'risk' | 'political'

interface StateData {
  stateCode: string
  stateName: string
  totalEnrolments: number
  totalBiometricUpdates: number
  totalDemographicUpdates: number
  coverage: number
  freshness: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ageDistribution: { infants: number; children: number; adults: number }
  districtsCount: number
  pincodesCount: number
}

// Health score explanation
const HEALTH_METHODOLOGY = {
  title: 'Identity Health Index — How It\'s Calculated',
  factors: [
    {
      name: 'Enrolment Coverage (40%)',
      description: 'Ratio of total Aadhaar enrolments to estimated state population. States with ≥98% coverage score highest.',
      formula: 'coverage = (totalEnrolments / statePopulation) × 100 + base',
    },
    {
      name: 'Data Freshness (35%)',
      description: 'Ratio of biometric updates to total enrolments. Reflects how recently citizens have updated their biometrics.',
      formula: 'freshness = 75 + (biometricUpdates / totalEnrolments) × 100',
    },
    {
      name: 'Trend Consistency (15%)',
      description: 'Stability of daily enrolment and update patterns. Sudden spikes or drops reduce the score.',
      formula: 'Calculated from 30-day rolling standard deviation of daily counts',
    },
    {
      name: 'Volume Score (10%)',
      description: 'Absolute volume of enrolments — larger states with more data points get a slight boost.',
      formula: 'Low (<10K) = 0, Medium (<100K) = 1, High (≥100K) = 2',
    },
  ],
  riskLevels: [
    { level: 'Low', color: 'bg-emerald-500', condition: 'Coverage ≥98% AND Freshness ≥90%' },
    { level: 'Medium', color: 'bg-amber-500', condition: 'Coverage 95–98% OR Freshness 85–90%' },
    { level: 'High', color: 'bg-orange-500', condition: 'Coverage 90–95% OR Freshness 80–85%' },
    { level: 'Critical', color: 'bg-red-500', condition: 'Coverage <90% OR Freshness <80%' },
  ]
}

export default function DigitalTwinPage() {
  const [mapMode, setMapMode] = useState<MapMode>('health')
  const [selectedYear, setSelectedYear] = useState(2025)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [statesData, setStatesData] = useState<StateData[]>([])
  const [loading, setLoading] = useState(true)
  const [showMethodology, setShowMethodology] = useState(false)

  const mapModes = [
    { id: 'health', label: 'Identity Health', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'saturation', label: 'Enrolment', icon: Users, color: 'text-cyan-500' },
    { id: 'freshness', label: 'Freshness', icon: RefreshCw, color: 'text-blue-500' },
    { id: 'risk', label: 'Risk', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'political', label: 'Political', icon: Layers, color: 'text-purple-500' },
  ]

  useEffect(() => {
    fetch('/api/states')
      .then(r => r.json())
      .then(json => { if (json.success) setStatesData(json.data.states || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setSelectedYear(y => {
        if (y >= 2025) { setIsPlaying(false); return 2025 }
        return y + 1
      })
    }, 800)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleStateClick = (stateId: string) => setSelectedState(stateId)
  const getYearData = (year: number) =>
    timelineData.find(d => d.year === year) || timelineData[timelineData.length - 1]
  const currentYearData = getYearData(selectedYear)

  const selectedStateData = statesData.find(s =>
    s.stateCode === selectedState ||
    s.stateName.toLowerCase().replace(/\s+/g, '') === selectedState?.toLowerCase()
  )

  const totalEnrolments = statesData.reduce((sum, s) => sum + s.totalEnrolments, 0)

  return (
    <main className="min-h-screen bg-gati-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-gati-muted" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg text-gati-primary truncate">India Digital Twin</h1>
              <p className="text-xs text-gati-muted truncate">
                {loading ? 'Loading...' : `${statesData.length} states • ${formatIndianNumber(totalEnrolments)} enrolments`}
              </p>
            </div>
          </div>

          {/* Mode selector — scrollable on small screens */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 overflow-x-auto flex-shrink-0">
            {mapModes.map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.id}
                  onClick={() => setMapMode(mode.id as MapMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    mapMode === mode.id ? 'bg-white shadow-sm text-gati-primary' : 'text-gati-muted hover:text-gati-primary'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${mapMode === mode.id ? mode.color : ''}`} />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gati-muted border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              How it works
            </button>
            <Link href="/admin" className="gati-btn-primary text-xs px-3 py-1.5">Admin</Link>
          </div>
        </div>
      </header>

      <div className="pt-[60px] flex h-screen overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatedGrid />

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-gati-accent mx-auto mb-3" />
                <p className="text-gati-muted font-medium">Loading real Aadhaar data...</p>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="absolute inset-3 rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <IndiaMap
              mode={mapMode}
              onStateClick={handleStateClick}
              showLabels={true}
              interactive={true}
              statesData={statesData}
            />
          </div>

          {/* How to use — top left, compact */}
          <motion.div
            className="absolute top-5 left-5 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-gray-100 w-44"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-gati-accent flex-shrink-0" />
              <span className="text-xs font-semibold text-gati-text">How to Use</span>
            </div>
            <ul className="text-[11px] text-gati-muted space-y-1 leading-relaxed">
              <li>• Click a state for details</li>
              <li>• Slider = historical view</li>
              <li>• Toggle modes above</li>
              <li>• Zoom on the right</li>
            </ul>
          </motion.div>

          {/* Timeline — bottom, properly spaced */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-4"
            style={{ maxWidth: 'calc(100% - 32px)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-gati-primary text-white flex items-center justify-center hover:bg-gati-secondary transition-colors flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              {/* Year stepper */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedYear(Math.max(2012, selectedYear - 1))}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gati-muted" />
                </button>
                <div className="text-center w-16">
                  <div className="text-2xl font-bold text-gati-primary leading-none">{selectedYear}</div>
                  <div className="text-[10px] text-gati-muted mt-0.5">Year</div>
                </div>
                <button
                  onClick={() => setSelectedYear(Math.min(2025, selectedYear + 1))}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gati-muted" />
                </button>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-1 w-48 flex-shrink-0">
                <input
                  type="range" min={2012} max={2025} value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full accent-gati-accent h-1.5"
                />
                <div className="flex justify-between text-[10px] text-gati-muted">
                  <span>2012</span><span>2025</span>
                </div>
              </div>

              {/* Stats — separated clearly */}
              <div className="flex items-center gap-4 border-l border-gray-200 pl-4 flex-shrink-0">
                <div className="text-center">
                  <div className="text-xl font-bold text-gati-text leading-none">
                    {currentYearData.coverage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-gati-muted mt-0.5">Coverage</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gati-text leading-none">
                    {formatIndianNumber(currentYearData.enrolments)}
                  </div>
                  <div className="text-[10px] text-gati-muted mt-0.5">Enrolments</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar — State Details */}
        {selectedState && (
          <motion.aside
            className="w-80 bg-white border-l border-gray-100 h-full overflow-y-auto flex-shrink-0"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-5">
              {selectedStateData ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gati-text">{selectedStateData.stateName}</h2>
                    <button
                      onClick={() => setSelectedState(null)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gati-muted transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {/* Risk badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                    selectedStateData.riskLevel === 'low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    selectedStateData.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    selectedStateData.riskLevel === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {selectedStateData.riskLevel.charAt(0).toUpperCase() + selectedStateData.riskLevel.slice(1)} Risk
                  </div>

                  {/* Coverage + Freshness */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gati-muted mb-1 uppercase tracking-wide">Coverage</p>
                      <p className="text-xl font-bold text-gati-text">{selectedStateData.coverage.toFixed(1)}%</p>
                      <ProgressBar value={selectedStateData.coverage} showLabel={false} size="small" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gati-muted mb-1 uppercase tracking-wide">Freshness</p>
                      <p className="text-xl font-bold text-gati-text">{selectedStateData.freshness.toFixed(1)}%</p>
                      <ProgressBar
                        value={selectedStateData.freshness}
                        showLabel={false}
                        size="small"
                        color={selectedStateData.freshness > 90 ? 'bg-emerald-500' : selectedStateData.freshness > 80 ? 'bg-amber-500' : 'bg-red-500'}
                      />
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'Total Enrolments', value: formatIndianNumber(selectedStateData.totalEnrolments) },
                      { label: 'Biometric Updates', value: formatIndianNumber(selectedStateData.totalBiometricUpdates) },
                      { label: 'Demographic Updates', value: formatIndianNumber(selectedStateData.totalDemographicUpdates) },
                      { label: 'Districts', value: selectedStateData.districtsCount.toString() },
                      { label: 'Pincodes', value: selectedStateData.pincodesCount.toString() },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                        <span className="text-xs text-gati-muted">{item.label}</span>
                        <span className="text-xs font-semibold text-gati-text">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Age Distribution */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gati-text mb-2 uppercase tracking-wide">Age Distribution</h3>
                    {(() => {
                      const total = selectedStateData.ageDistribution.infants +
                        selectedStateData.ageDistribution.children +
                        selectedStateData.ageDistribution.adults
                      const pcts = [
                        { label: '0–5 yrs', pct: total > 0 ? (selectedStateData.ageDistribution.infants / total * 100) : 0, color: 'bg-cyan-400' },
                        { label: '5–17 yrs', pct: total > 0 ? (selectedStateData.ageDistribution.children / total * 100) : 0, color: 'bg-blue-400' },
                        { label: '18+ yrs', pct: total > 0 ? (selectedStateData.ageDistribution.adults / total * 100) : 0, color: 'bg-emerald-400' },
                      ]
                      return (
                        <div className="space-y-1.5">
                          {pcts.map(item => (
                            <div key={item.label}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gati-muted">{item.label}</span>
                                <span className="font-medium text-gati-text">{item.pct.toFixed(1)}%</span>
                              </div>
                              <ProgressBar value={item.pct} showLabel={false} size="small" color={item.color} />
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* AI Insight */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-xs font-semibold text-gati-text">AI Insight</span>
                    </div>
                    <p className="text-xs text-gati-muted leading-relaxed">
                      {selectedStateData.riskLevel === 'critical' && 'Critical: Significant delays in child enrolment and biometric updates. Immediate field intervention recommended.'}
                      {selectedStateData.riskLevel === 'high' && 'High risk: Delayed biometric transitions detected. Mobile update camps recommended. Monitor migration patterns.'}
                      {selectedStateData.riskLevel === 'medium' && 'Moderate backlog. Seasonal migration may be contributing. Monitor closely next quarter.'}
                      {selectedStateData.riskLevel === 'low' && 'Performing well across all metrics. Continue current operations and monitoring.'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href="/analytics" className="flex-1 gati-btn-primary text-xs text-center py-2">
                      View Analytics
                    </Link>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4 text-gati-muted" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gati-accent mx-auto mb-3" />
                  <p className="text-gati-muted text-sm">Loading state data...</p>
                  <button onClick={() => setSelectedState(null)} className="mt-4 text-xs text-gati-muted hover:text-gati-text">Close</button>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </div>

      {/* Methodology Modal */}
      {showMethodology && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowMethodology(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gati-primary">{HEALTH_METHODOLOGY.title}</h2>
                <button onClick={() => setShowMethodology(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gati-muted">×</button>
              </div>

              <p className="text-sm text-gati-muted mb-6 leading-relaxed">
                The Identity Health Index is a composite score derived from your real CSV data — biometric, demographic, and enrolment records. It reflects how well a state is maintaining Aadhaar coverage and data freshness for its population.
              </p>

              <div className="space-y-4 mb-6">
                {HEALTH_METHODOLOGY.factors.map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-gati-primary text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <h3 className="font-semibold text-gati-text text-sm">{f.name}</h3>
                    </div>
                    <p className="text-xs text-gati-muted mb-2 leading-relaxed">{f.description}</p>
                    <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gati-accent block">{f.formula}</code>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-gati-text mb-3 text-sm">Risk Level Thresholds</h3>
                <div className="space-y-2">
                  {HEALTH_METHODOLOGY.riskLevels.map((r) => (
                    <div key={r.level} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${r.color} flex-shrink-0`} />
                      <span className="text-sm font-medium text-gati-text w-16">{r.level}</span>
                      <span className="text-xs text-gati-muted">{r.condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Data source:</strong> All scores are computed server-side from your CSV files (biometric, demographic, enrolment). No external data or estimates are used. Population denominators come from the STATE_POPULATION constants in the data layer.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating AI Chat Button */}
      <Link
        href="/intelligence"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-gati-primary to-gati-secondary text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">Ask GATI AI</span>
      </Link>
    </main>
  )
}
