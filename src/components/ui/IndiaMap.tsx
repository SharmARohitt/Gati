'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCcw, Layers, Info } from 'lucide-react'
import { stateData } from '@/lib/data'
import { StateCoverageCard } from './StatCards'
import { formatIndianNumber } from '@/lib/utils'

// India states path data (simplified SVG paths for each state)
const indiaStatesData = [
  { id: 'JK', name: 'Jammu & Kashmir', path: 'M180,20 L220,30 L240,60 L220,90 L180,85 L160,50 Z', cx: 195, cy: 55 },
  { id: 'HP', name: 'Himachal Pradesh', path: 'M210,85 L240,80 L250,100 L230,115 L200,105 Z', cx: 225, cy: 97 },
  { id: 'PB', name: 'Punjab', path: 'M175,95 L200,90 L210,115 L190,130 L165,120 Z', cx: 187, cy: 110 },
  { id: 'UK', name: 'Uttarakhand', path: 'M235,100 L270,95 L280,120 L260,140 L230,125 Z', cx: 255, cy: 115 },
  { id: 'HR', name: 'Haryana', path: 'M185,125 L215,120 L225,145 L200,160 L175,150 Z', cx: 200, cy: 140 },
  { id: 'DL', name: 'Delhi', path: 'M205,145 L215,143 L218,155 L208,158 Z', cx: 211, cy: 150 },
  { id: 'RJ', name: 'Rajasthan', path: 'M120,145 L185,140 L200,180 L180,250 L100,230 L90,180 Z', cx: 145, cy: 195 },
  { id: 'UP', name: 'Uttar Pradesh', path: 'M210,145 L290,130 L340,180 L310,230 L240,240 L200,200 Z', cx: 265, cy: 185 },
  { id: 'BR', name: 'Bihar', path: 'M330,195 L380,185 L400,210 L385,240 L340,245 L320,220 Z', cx: 360, cy: 215 },
  { id: 'SK', name: 'Sikkim', path: 'M395,170 L415,165 L420,185 L405,195 L390,185 Z', cx: 405, cy: 178 },
  { id: 'AS', name: 'Assam', path: 'M420,185 L500,170 L510,200 L490,220 L420,225 L410,200 Z', cx: 460, cy: 198 },
  { id: 'WB', name: 'West Bengal', path: 'M380,235 L410,220 L430,260 L400,320 L370,290 L365,250 Z', cx: 395, cy: 275 },
  { id: 'JH', name: 'Jharkhand', path: 'M330,245 L380,238 L385,280 L350,300 L315,285 L310,260 Z', cx: 348, cy: 270 },
  { id: 'OR', name: 'Odisha', path: 'M310,290 L365,280 L395,320 L370,380 L300,370 L280,320 Z', cx: 335, cy: 335 },
  { id: 'CG', name: 'Chhattisgarh', path: 'M260,270 L310,260 L330,310 L310,360 L255,350 L240,300 Z', cx: 280, cy: 310 },
  { id: 'MP', name: 'Madhya Pradesh', path: 'M160,230 L260,220 L280,270 L260,330 L180,340 L130,290 Z', cx: 205, cy: 280 },
  { id: 'GJ', name: 'Gujarat', path: 'M60,240 L130,230 L150,280 L130,340 L60,350 L30,300 Z', cx: 90, cy: 290 },
  { id: 'MH', name: 'Maharashtra', path: 'M100,330 L200,320 L260,340 L270,410 L180,440 L80,400 Z', cx: 175, cy: 380 },
  { id: 'TS', name: 'Telangana', path: 'M200,380 L270,370 L300,400 L280,440 L210,450 L190,410 Z', cx: 245, cy: 410 },
  { id: 'AP', name: 'Andhra Pradesh', path: 'M210,445 L300,420 L340,480 L300,540 L220,530 L190,480 Z', cx: 260, cy: 480 },
  { id: 'KA', name: 'Karnataka', path: 'M120,420 L200,410 L220,470 L200,540 L120,550 L90,480 Z', cx: 155, cy: 480 },
  { id: 'GA', name: 'Goa', path: 'M95,465 L115,460 L118,480 L100,488 Z', cx: 106, cy: 474 },
  { id: 'KL', name: 'Kerala', path: 'M130,540 L160,530 L175,590 L150,640 L120,620 L115,570 Z', cx: 145, cy: 585 },
  { id: 'TN', name: 'Tamil Nadu', path: 'M160,530 L230,510 L260,560 L240,630 L170,640 L150,590 Z', cx: 200, cy: 580 },
  { id: 'NE', name: 'Northeast', path: 'M440,180 L520,170 L540,220 L510,260 L440,250 L430,210 Z', cx: 480, cy: 215 }
]

interface IndiaMapProps {
  mode?: 'health' | 'saturation' | 'freshness' | 'risk'
  onStateClick?: (stateId: string) => void
  showLabels?: boolean
  interactive?: boolean
}

export function IndiaMap({ 
  mode = 'health', 
  onStateClick,
  showLabels = true,
  interactive = true 
}: IndiaMapProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const getStateColor = (stateId: string) => {
    const state = stateData.find(s => s.id === stateId)
    if (!state) return 'fill-gray-200'
    
    if (mode === 'risk') {
      const riskColors = {
        low: 'fill-emerald-400',
        medium: 'fill-amber-400',
        high: 'fill-orange-500',
        critical: 'fill-red-500'
      }
      return riskColors[state.risk as keyof typeof riskColors] || 'fill-gray-200'
    }
    
    if (mode === 'health' || mode === 'saturation') {
      const coverage = state.coverage
      if (coverage >= 98) return 'fill-emerald-400'
      if (coverage >= 95) return 'fill-cyan-400'
      if (coverage >= 90) return 'fill-amber-400'
      return 'fill-red-400'
    }
    
    if (mode === 'freshness') {
      const freshness = state.freshness
      if (freshness >= 95) return 'fill-emerald-400'
      if (freshness >= 90) return 'fill-cyan-400'
      if (freshness >= 85) return 'fill-amber-400'
      return 'fill-red-400'
    }
    
    return 'fill-gati-light'
  }

  const getStateData = (stateId: string) => {
    return stateData.find(s => s.id === stateId)
  }

  const handleStateClick = (stateId: string) => {
    if (!interactive) return
    setSelectedState(stateId)
    onStateClick?.(stateId)
  }

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2.5))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-gradient-to-b from-white to-gati-light/20 rounded-2xl overflow-hidden">
      {/* Glow effect background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(72,202,228,0.1)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>
      
      {/* Controls */}
      {interactive && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ZoomIn className="w-4 h-4 text-gati-muted" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ZoomOut className="w-4 h-4 text-gati-muted" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
          >
            <RotateCcw className="w-4 h-4 text-gati-muted" />
          </button>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gati-muted" />
          <span className="text-xs font-medium text-gati-muted uppercase tracking-wide">
            {mode === 'health' && 'Identity Health'}
            {mode === 'saturation' && 'Enrolment Saturation'}
            {mode === 'freshness' && 'Update Freshness'}
            {mode === 'risk' && 'Risk Level'}
          </span>
        </div>
        <div className="space-y-1.5">
          {mode === 'risk' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gati-text">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs text-gati-text">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-gati-text">High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gati-text">Critical</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gati-text">≥98%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-xs text-gati-text">95-98%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-xs text-gati-text">90-95%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-xs text-gati-text">&lt;90%</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* SVG Map */}
      <motion.svg
        viewBox="0 0 560 680"
        className="w-full h-full"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
          </filter>
          
          {/* State gradient */}
          <linearGradient id="stateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>
        
        {/* Ocean/background */}
        <rect x="0" y="0" width="560" height="680" fill="transparent" />
        
        {/* States */}
        <g filter="url(#shadow)">
          {indiaStatesData.map((state) => (
            <g key={state.id}>
              <motion.path
                d={state.path}
                className={`
                  ${getStateColor(state.id)}
                  stroke-white stroke-[1.5]
                  cursor-pointer
                  transition-all duration-300
                `}
                style={{
                  filter: hoveredState === state.id ? 'url(#glow)' : undefined
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: hoveredState === state.id ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
                onMouseEnter={() => setHoveredState(state.id)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => handleStateClick(state.id)}
              />
              
              {/* Pulsing node for critical/high risk states */}
              {getStateData(state.id)?.risk === 'critical' && (
                <motion.circle
                  cx={state.cx}
                  cy={state.cy}
                  r="6"
                  className="fill-red-500"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 0.4, 0.8]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
              
              {/* State label */}
              {showLabels && zoom >= 1 && (
                <text
                  x={state.cx}
                  y={state.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px] font-semibold fill-gati-primary pointer-events-none"
                  style={{ opacity: hoveredState === state.id ? 1 : 0.7 }}
                >
                  {state.id}
                </text>
              )}
            </g>
          ))}
        </g>
      </motion.svg>
      
      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredState && !selectedState && (
          <motion.div
            className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-100 z-30 min-w-[200px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {(() => {
              const state = getStateData(hoveredState)
              if (!state) return null
              return (
                <>
                  <h4 className="font-semibold text-gati-text mb-2">{state.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gati-muted text-xs">Coverage</p>
                      <p className="font-medium text-gati-text">{state.coverage}%</p>
                    </div>
                    <div>
                      <p className="text-gati-muted text-xs">Enrolments</p>
                      <p className="font-medium text-gati-text">{formatIndianNumber(state.enrolments)}</p>
                    </div>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selected state detail panel */}
      <AnimatePresence>
        {selectedState && (
          <motion.div
            className="absolute right-4 top-20 bottom-4 w-80 z-30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="relative h-full">
              <button
                onClick={() => setSelectedState(null)}
                className="absolute -left-3 top-4 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50"
              >
                <X className="w-4 h-4 text-gati-muted" />
              </button>
              
              {(() => {
                const state = getStateData(selectedState)
                if (!state) return null
                return <StateCoverageCard state={state} />
              })()}
              
              {/* AI Insight */}
              <motion.div
                className="mt-4 gati-panel p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gati-accent" />
                  <span className="text-sm font-medium text-gati-text">AI Insight</span>
                </div>
                <p className="text-sm text-gati-muted leading-relaxed">
                  {(() => {
                    const state = getStateData(selectedState)
                    if (!state) return ''
                    if (state.risk === 'critical') return 'This region shows significant delays in child enrolment and biometric updates. Immediate field intervention recommended.'
                    if (state.risk === 'high') return 'This district shows delayed biometric transitions among adolescents. Mobile camp deployment suggested.'
                    if (state.risk === 'medium') return 'Moderate update backlog detected. Seasonal migration patterns may be contributing factor.'
                    return 'Region performing well. Continue monitoring for sustained coverage.'
                  })()}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact map for dashboard
export function MiniIndiaMap({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <IndiaMap 
        mode="risk" 
        showLabels={false} 
        interactive={false}
      />
    </div>
  )
}
