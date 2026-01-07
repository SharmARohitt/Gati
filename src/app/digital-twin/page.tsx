'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Layers, 
  Clock, 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  RefreshCw,
  AlertTriangle,
  Info,
  Download
} from 'lucide-react'
import { 
  IndiaMap, 
  AnimatedGrid,
  AnimatedCounter,
  ProgressBar,
  TimelineChart,
  Footer
} from '@/components/ui'
import { stateData, timelineData } from '@/lib/data'
import { formatIndianNumber } from '@/lib/utils'

type MapMode = 'health' | 'saturation' | 'freshness' | 'risk' | 'political'

export default function DigitalTwinPage() {
  const [mapMode, setMapMode] = useState<MapMode>('health')
  const [selectedYear, setSelectedYear] = useState(2025)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const mapModes = [
    { id: 'health', label: 'Identity Health Index', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'saturation', label: 'Enrolment Saturation', icon: Users, color: 'text-cyan-500' },
    { id: 'freshness', label: 'Update Freshness', icon: RefreshCw, color: 'text-blue-500' },
    { id: 'risk', label: 'Risk Prediction', icon: AlertTriangle, color: 'text-amber-500' },
    { id: 'political', label: 'Political View', icon: Layers, color: 'text-purple-500' },
  ]

  const handleStateClick = (stateId: string) => {
    setSelectedState(stateId)
  }

  const getYearData = (year: number) => {
    return timelineData.find(d => d.year === year) || timelineData[timelineData.length - 1]
  }

  const currentYearData = getYearData(selectedYear)

  return (
    <main className="min-h-screen bg-gati-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gati-muted" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-gati-primary">
                India 3D Digital Twin
              </h1>
              <p className="text-sm text-gati-muted">Interactive identity landscape visualization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mode selector */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {mapModes.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setMapMode(mode.id as MapMode)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${mapMode === mode.id 
                        ? 'bg-white shadow-sm text-gati-primary' 
                        : 'text-gati-muted hover:text-gati-primary'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${mapMode === mode.id ? mode.color : ''}`} />
                    <span className="hidden lg:inline">{mode.label}</span>
                  </button>
                )
              })}
            </div>
            
            <Link href="/admin" className="gati-btn-primary text-sm">
              Admin Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 flex">
        {/* Map Container */}
        <div className="flex-1 h-[calc(100vh-80px)] relative">
          <AnimatedGrid />
          
          {/* Main Map */}
          <div className="absolute inset-4 rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <IndiaMap 
              mode={mapMode} 
              onStateClick={handleStateClick}
              showLabels={true}
              interactive={true}
            />
          </div>

          {/* Timeline Slider */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-gati-primary text-white flex items-center justify-center hover:bg-gati-secondary transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedYear(Math.max(2012, selectedYear - 1))}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gati-muted" />
                </button>
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-gati-primary">{selectedYear}</span>
                  <span className="text-xs text-gati-muted">Year</span>
                </div>
                
                <button 
                  onClick={() => setSelectedYear(Math.min(2025, selectedYear + 1))}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5 text-gati-muted" />
                </button>
              </div>
              
              <div className="flex-1 w-64">
                <input
                  type="range"
                  min={2012}
                  max={2025}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full accent-gati-accent"
                />
                <div className="flex justify-between text-xs text-gati-muted mt-1">
                  <span>2012</span>
                  <span>2025</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-gati-text">
                  <AnimatedCounter value={currentYearData.coverage} suffix="%" decimals={1} useIndianFormat={false} />
                </div>
                <span className="text-xs text-gati-muted">Coverage</span>
              </div>
              
              <div className="text-right border-l border-gray-200 pl-6">
                <div className="text-2xl font-bold text-gati-text">
                  {formatIndianNumber(currentYearData.enrolments)}
                </div>
                <span className="text-xs text-gati-muted">Enrolments</span>
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div 
            className="absolute top-8 left-8 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100 max-w-xs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gati-accent" />
              <span className="text-sm font-medium text-gati-text">How to Use</span>
            </div>
            <ul className="text-xs text-gati-muted space-y-1">
              <li>• Click any state for detailed analytics</li>
              <li>• Use slider to view historical data</li>
              <li>• Toggle modes for different views</li>
              <li>• Zoom controls on the right</li>
            </ul>
          </motion.div>
        </div>

        {/* Right Sidebar - State Details */}
        {selectedState && (
          <motion.aside
            className="w-96 bg-white border-l border-gray-100 h-[calc(100vh-80px)] overflow-y-auto"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="p-6">
              {(() => {
                const state = stateData.find(s => s.id === selectedState)
                if (!state) return null

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gati-text">{state.name}</h2>
                      <button
                        onClick={() => setSelectedState(null)}
                        className="text-gati-muted hover:text-gati-text"
                      >
                        ×
                      </button>
                    </div>

                    {/* Risk Badge */}
                    <div className={`
                      inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mb-6
                      ${state.risk === 'low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                      ${state.risk === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                      ${state.risk === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                      ${state.risk === 'critical' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ''}
                    `}>
                      {state.risk.charAt(0).toUpperCase() + state.risk.slice(1)} Risk
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="gati-panel p-4">
                        <p className="text-xs text-gati-muted mb-1">Coverage</p>
                        <p className="text-2xl font-bold text-gati-text">{state.coverage}%</p>
                        <ProgressBar value={state.coverage} showLabel={false} size="small" />
                      </div>
                      <div className="gati-panel p-4">
                        <p className="text-xs text-gati-muted mb-1">Freshness</p>
                        <p className="text-2xl font-bold text-gati-text">{state.freshness}%</p>
                        <ProgressBar 
                          value={state.freshness} 
                          showLabel={false} 
                          size="small"
                          color={state.freshness > 90 ? 'bg-emerald-500' : state.freshness > 80 ? 'bg-amber-500' : 'bg-red-500'}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm text-gati-muted">Total Enrolments</span>
                        <span className="font-semibold text-gati-text">{formatIndianNumber(state.enrolments)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-sm text-gati-muted">Monthly Updates</span>
                        <span className="font-semibold text-gati-text">{formatIndianNumber(state.updates)}</span>
                      </div>
                    </div>

                    {/* AI Insight */}
                    <div className="gati-panel-glow p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                          <span className="text-lg">🧠</span>
                        </div>
                        <span className="font-semibold text-gati-text">AI Insight</span>
                      </div>
                      <p className="text-sm text-gati-muted leading-relaxed">
                        {state.risk === 'critical' && 'This region shows significant delays in child enrolment and biometric updates. Immediate field intervention recommended. Pattern suggests correlation with remote area accessibility.'}
                        {state.risk === 'high' && 'This district shows delayed biometric transitions among adolescents. Mobile update camps recommended. Increased migration patterns detected.'}
                        {state.risk === 'medium' && 'Moderate update backlog detected. Seasonal migration patterns may be contributing factor. Monitor closely for next quarter.'}
                        {state.risk === 'low' && 'Region performing well across all metrics. Continue current operations and monitoring for sustained coverage.'}
                      </p>
                    </div>

                    {/* Age Bucket Distribution */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gati-text mb-3">Age Distribution</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gati-muted">0-5 Years</span>
                            <span className="font-medium">72.4%</span>
                          </div>
                          <ProgressBar value={72.4} showLabel={false} size="small" color="bg-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gati-muted">5-17 Years</span>
                            <span className="font-medium">96.8%</span>
                          </div>
                          <ProgressBar value={96.8} showLabel={false} size="small" color="bg-blue-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gati-muted">18+ Years</span>
                            <span className="font-medium">98.9%</span>
                          </div>
                          <ProgressBar value={98.9} showLabel={false} size="small" color="bg-emerald-400" />
                        </div>
                      </div>
                    </div>

                    {/* Gender Ratio */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gati-text mb-3">Gender Coverage</h3>
                      <div className="flex gap-4">
                        <div className="flex-1 gati-panel p-3 text-center">
                          <p className="text-lg font-bold text-blue-600">97.4%</p>
                          <p className="text-xs text-gati-muted">Male</p>
                        </div>
                        <div className="flex-1 gati-panel p-3 text-center">
                          <p className="text-lg font-bold text-pink-600">96.9%</p>
                          <p className="text-xs text-gati-muted">Female</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button className="flex-1 gati-btn-primary text-sm">
                        View Detailed Report
                      </button>
                      <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 text-gati-muted" />
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.aside>
        )}
      </div>
    </main>
  )
}
