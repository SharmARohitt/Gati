'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, TrendingUp, Users, AlertTriangle } from 'lucide-react'
import { stateData } from '@/lib/data'
import { formatIndianNumber } from '@/lib/utils'

// Detailed India states SVG path data - accurate geographic representation
const indiaStatesData = [
  // Northern States
  { 
    id: 'JK', 
    name: 'Jammu & Kashmir', 
    capital: 'Srinagar',
    path: 'M168,8 L175,5 L185,8 L200,12 L215,18 L225,28 L230,42 L228,58 L222,72 L212,82 L198,88 L185,92 L172,88 L160,78 L152,65 L148,50 L152,35 L158,22 L168,8 Z',
    cx: 188, cy: 48
  },
  { 
    id: 'LA', 
    name: 'Ladakh', 
    capital: 'Leh',
    path: 'M230,5 L265,2 L290,8 L305,25 L300,45 L288,60 L270,68 L252,62 L238,52 L230,42 L228,25 L230,5 Z',
    cx: 265, cy: 35
  },
  { 
    id: 'HP', 
    name: 'Himachal Pradesh', 
    capital: 'Shimla',
    path: 'M198,88 L212,82 L228,85 L242,92 L250,105 L245,118 L232,125 L218,122 L205,115 L195,105 L192,95 L198,88 Z',
    cx: 220, cy: 105
  },
  { 
    id: 'PB', 
    name: 'Punjab', 
    capital: 'Chandigarh',
    path: 'M172,102 L192,95 L205,108 L210,122 L202,135 L188,142 L172,138 L162,128 L160,115 L172,102 Z',
    cx: 185, cy: 120
  },
  { 
    id: 'UK', 
    name: 'Uttarakhand', 
    capital: 'Dehradun',
    path: 'M245,105 L265,98 L285,105 L295,120 L288,138 L272,148 L255,145 L240,135 L235,120 L245,105 Z',
    cx: 265, cy: 125
  },
  { 
    id: 'HR', 
    name: 'Haryana', 
    capital: 'Chandigarh',
    path: 'M175,138 L202,135 L218,145 L222,162 L212,178 L192,182 L175,175 L165,160 L168,145 L175,138 Z',
    cx: 192, cy: 158
  },
  { 
    id: 'DL', 
    name: 'Delhi', 
    capital: 'New Delhi',
    path: 'M205,160 L215,158 L220,168 L215,178 L205,180 L200,170 L205,160 Z',
    cx: 210, cy: 169
  },
  { 
    id: 'RJ', 
    name: 'Rajasthan', 
    capital: 'Jaipur',
    path: 'M90,165 L125,155 L165,152 L188,160 L200,180 L195,215 L185,250 L165,280 L130,290 L95,280 L65,255 L55,220 L60,185 L90,165 Z',
    cx: 130, cy: 218
  },
  { 
    id: 'UP', 
    name: 'Uttar Pradesh', 
    capital: 'Lucknow',
    path: 'M205,155 L240,145 L275,148 L310,160 L345,178 L365,200 L358,225 L335,248 L295,258 L255,262 L220,258 L195,245 L185,218 L192,190 L205,155 Z',
    cx: 275, cy: 205
  },
  { 
    id: 'BR', 
    name: 'Bihar', 
    capital: 'Patna',
    path: 'M345,205 L378,195 L405,205 L418,225 L412,250 L390,265 L358,268 L338,255 L335,235 L345,205 Z',
    cx: 375, cy: 232
  },
  { 
    id: 'SK', 
    name: 'Sikkim', 
    capital: 'Gangtok',
    path: 'M418,178 L432,172 L442,182 L438,198 L425,205 L415,195 L418,178 Z',
    cx: 428, cy: 188
  },
  { 
    id: 'AR', 
    name: 'Arunachal Pradesh', 
    capital: 'Itanagar',
    path: 'M485,145 L520,138 L555,148 L570,165 L565,188 L545,205 L515,210 L485,200 L472,180 L478,158 L485,145 Z',
    cx: 522, cy: 175
  },
  { 
    id: 'NL', 
    name: 'Nagaland', 
    capital: 'Kohima',
    path: 'M545,205 L565,200 L575,218 L568,238 L548,245 L535,235 L538,218 L545,205 Z',
    cx: 555, cy: 222
  },
  { 
    id: 'MN', 
    name: 'Manipur', 
    capital: 'Imphal',
    path: 'M548,248 L568,242 L578,260 L572,282 L555,290 L538,280 L535,262 L548,248 Z',
    cx: 556, cy: 268
  },
  { 
    id: 'MZ', 
    name: 'Mizoram', 
    capital: 'Aizawl',
    path: 'M528,290 L545,282 L558,295 L555,320 L540,335 L522,325 L518,305 L528,290 Z',
    cx: 538, cy: 310
  },
  { 
    id: 'TR', 
    name: 'Tripura', 
    capital: 'Agartala',
    path: 'M502,290 L518,285 L528,302 L522,325 L505,332 L492,318 L495,298 L502,290 Z',
    cx: 510, cy: 308
  },
  { 
    id: 'ML', 
    name: 'Meghalaya', 
    capital: 'Shillong',
    path: 'M455,232 L492,225 L515,235 L518,252 L498,262 L468,258 L450,248 L455,232 Z',
    cx: 482, cy: 245
  },
  { 
    id: 'AS', 
    name: 'Assam', 
    capital: 'Dispur',
    path: 'M435,195 L468,188 L502,195 L535,202 L545,218 L535,235 L518,252 L492,260 L455,265 L435,255 L428,235 L430,215 L435,195 Z M502,265 L518,262 L532,275 L525,290 L505,288 L495,278 L502,265 Z',
    cx: 475, cy: 225
  },
  { 
    id: 'WB', 
    name: 'West Bengal', 
    capital: 'Kolkata',
    path: 'M390,258 L418,248 L445,255 L460,278 L455,312 L435,355 L410,378 L388,365 L378,330 L375,295 L382,270 L390,258 Z',
    cx: 415, cy: 310
  },
  { 
    id: 'JH', 
    name: 'Jharkhand', 
    capital: 'Ranchi',
    path: 'M335,258 L375,252 L395,272 L398,305 L378,330 L348,338 L320,325 L315,295 L325,272 L335,258 Z',
    cx: 355, cy: 295
  },
  { 
    id: 'OR', 
    name: 'Odisha', 
    capital: 'Bhubaneswar',
    path: 'M318,328 L355,318 L395,332 L418,365 L408,410 L375,438 L332,442 L298,425 L285,390 L292,355 L318,328 Z',
    cx: 350, cy: 382
  },
  { 
    id: 'CG', 
    name: 'Chhattisgarh', 
    capital: 'Raipur',
    path: 'M278,295 L318,285 L342,310 L348,355 L328,395 L295,410 L262,395 L252,358 L258,320 L278,295 Z',
    cx: 300, cy: 348
  },
  { 
    id: 'MP', 
    name: 'Madhya Pradesh', 
    capital: 'Bhopal',
    path: 'M155,250 L198,238 L248,245 L285,265 L295,305 L280,355 L248,385 L195,392 L148,378 L125,338 L128,295 L155,250 Z',
    cx: 210, cy: 318
  },
  { 
    id: 'GJ', 
    name: 'Gujarat', 
    capital: 'Gandhinagar',
    path: 'M45,265 L85,250 L125,255 L148,285 L145,335 L125,378 L85,395 L48,388 L22,358 L18,315 L28,285 L45,265 Z',
    cx: 82, cy: 328
  },
  { 
    id: 'DD', 
    name: 'Daman & Diu', 
    capital: 'Daman',
    path: 'M52,395 L68,392 L72,405 L58,410 L52,395 Z',
    cx: 60, cy: 400
  },
  { 
    id: 'DN', 
    name: 'Dadra & Nagar Haveli', 
    capital: 'Silvassa',
    path: 'M72,405 L85,400 L92,418 L78,425 L72,405 Z',
    cx: 82, cy: 413
  },
  { 
    id: 'MH', 
    name: 'Maharashtra', 
    capital: 'Mumbai',
    path: 'M78,388 L128,375 L175,378 L215,390 L262,398 L285,428 L275,478 L235,515 L175,528 L115,512 L72,478 L55,438 L62,405 L78,388 Z',
    cx: 168, cy: 448
  },
  { 
    id: 'TS', 
    name: 'Telangana', 
    capital: 'Hyderabad',
    path: 'M225,425 L275,415 L315,432 L328,468 L312,505 L268,518 L232,508 L215,472 L225,425 Z',
    cx: 270, cy: 465
  },
  { 
    id: 'AP', 
    name: 'Andhra Pradesh', 
    capital: 'Amaravati',
    path: 'M235,508 L285,495 L332,505 L365,545 L355,598 L318,635 L265,648 L222,625 L205,575 L215,535 L235,508 Z',
    cx: 285, cy: 572
  },
  { 
    id: 'KA', 
    name: 'Karnataka', 
    capital: 'Bengaluru',
    path: 'M105,495 L165,478 L215,490 L248,525 L245,585 L225,638 L175,658 L118,645 L78,598 L72,545 L88,508 L105,495 Z',
    cx: 158, cy: 568
  },
  { 
    id: 'GA', 
    name: 'Goa', 
    capital: 'Panaji',
    path: 'M82,515 L98,508 L108,525 L102,545 L85,548 L75,535 L82,515 Z',
    cx: 92, cy: 528
  },
  { 
    id: 'KL', 
    name: 'Kerala', 
    capital: 'Thiruvananthapuram',
    path: 'M118,638 L148,625 L175,648 L182,702 L165,748 L135,758 L112,738 L102,695 L108,658 L118,638 Z',
    cx: 142, cy: 695
  },
  { 
    id: 'TN', 
    name: 'Tamil Nadu', 
    capital: 'Chennai',
    path: 'M165,618 L218,595 L268,608 L305,648 L312,705 L288,755 L238,772 L185,758 L158,715 L155,665 L165,618 Z',
    cx: 232, cy: 685
  },
  { 
    id: 'PY', 
    name: 'Puducherry', 
    capital: 'Puducherry',
    path: 'M238,652 L252,648 L258,665 L248,675 L235,668 L238,652 Z',
    cx: 246, cy: 662
  },
  { 
    id: 'LD', 
    name: 'Lakshadweep', 
    capital: 'Kavaratti',
    path: 'M42,645 L55,642 L58,658 L48,665 L38,655 L42,645 Z',
    cx: 48, cy: 653
  },
  { 
    id: 'AN', 
    name: 'Andaman & Nicobar', 
    capital: 'Port Blair',
    path: 'M455,515 L468,508 L478,525 L482,565 L478,608 L468,645 L455,652 L445,638 L442,595 L445,555 L455,515 Z',
    cx: 462, cy: 580
  }
]

// Political map colors based on reference
const politicalColors: Record<string, string> = {
  JK: 'fill-yellow-400', LA: 'fill-yellow-200', HP: 'fill-orange-300', PB: 'fill-cyan-400', 
  UK: 'fill-pink-300', HR: 'fill-purple-300', DL: 'fill-red-500', RJ: 'fill-yellow-400', 
  UP: 'fill-green-400', BR: 'fill-pink-300', SK: 'fill-cyan-300', AR: 'fill-blue-400', 
  NL: 'fill-orange-400', MN: 'fill-purple-400', MZ: 'fill-green-400', TR: 'fill-yellow-300', 
  ML: 'fill-pink-400', AS: 'fill-green-300', WB: 'fill-green-500', JH: 'fill-yellow-300', 
  OR: 'fill-orange-400', MP: 'fill-red-400', GJ: 'fill-green-400', MH: 'fill-green-500', 
  CT: 'fill-cyan-400', AP: 'fill-yellow-300', TS: 'fill-pink-500', GA: 'fill-blue-500', 
  KA: 'fill-yellow-400', KL: 'fill-orange-400', TN: 'fill-green-500', PY: 'fill-red-400', 
  DN: 'fill-purple-500', DD: 'fill-purple-500', LD: 'fill-cyan-500', AN: 'fill-green-500'
}

interface IndiaMapProps {
  mode?: 'health' | 'saturation' | 'freshness' | 'risk' | 'political'
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
    
    // Political mode doesn't need data
    if (mode === 'political') {
      return politicalColors[stateId] || 'fill-slate-200'
    }

    if (!state) return 'fill-slate-200'
    
    if (mode === 'risk') {
      const riskColors = {
        low: 'fill-emerald-400',
        medium: 'fill-amber-400',
        high: 'fill-orange-500',
        critical: 'fill-red-500'
      }
      return riskColors[state.risk as keyof typeof riskColors] || 'fill-slate-200'
    }
    
    if (mode === 'health' || mode === 'saturation') {
      const coverage = state.coverage
      if (coverage >= 98) return 'fill-emerald-500'
      if (coverage >= 95) return 'fill-cyan-500'
      if (coverage >= 90) return 'fill-amber-500'
      return 'fill-red-500'
    }
    
    if (mode === 'freshness') {
      const freshness = state.freshness
      if (freshness >= 95) return 'fill-emerald-500'
      if (freshness >= 90) return 'fill-cyan-500'
      if (freshness >= 85) return 'fill-amber-500'
      return 'fill-red-500'
    }
    
    return 'fill-gati-light'
  }

  const getHoverColor = (stateId: string) => {
    const state = stateData.find(s => s.id === stateId)
    if (!state) return 'fill-slate-300'
    
    if (mode === 'risk') {
      const riskColors = {
        low: 'fill-emerald-300',
        medium: 'fill-amber-300',
        high: 'fill-orange-400',
        critical: 'fill-red-400'
      }
      return riskColors[state.risk as keyof typeof riskColors] || 'fill-slate-300'
    }
    
    return 'fill-gati-accent'
  }

  const getStateData = (stateId: string) => {
    return stateData.find(s => s.id === stateId)
  }

  const handleStateClick = (stateId: string) => {
    if (!interactive) return
    setSelectedState(stateId === selectedState ? null : stateId)
    onStateClick?.(stateId)
  }

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2.5))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedState(null)
  }

  const selectedStateData = selectedState ? getStateData(selectedState) : null
  const selectedStateInfo = selectedState ? indiaStatesData.find(s => s.id === selectedState) : null

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 rounded-2xl overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,180,216,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(72,202,228,0.15)_0%,transparent_60%)]" />
      
      {/* Controls */}
      {interactive && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-gati-accent/50 group"
          >
            <ZoomIn className="w-4 h-4 text-gati-muted group-hover:text-gati-accent transition-colors" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-gati-accent/50 group"
          >
            <ZoomOut className="w-4 h-4 text-gati-muted group-hover:text-gati-accent transition-colors" />
          </button>
          <button
            onClick={handleReset}
            className="p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-gati-accent/50 group"
          >
            <RotateCcw className="w-4 h-4 text-gati-muted group-hover:text-gati-accent transition-colors" />
          </button>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-gati-accent" />
          <span className="text-xs font-semibold text-gati-text uppercase tracking-wider">
            {mode === 'health' && 'Identity Health'}
            {mode === 'saturation' && 'Enrolment Saturation'}
            {mode === 'freshness' && 'Update Freshness'}
            {mode === 'risk' && 'Risk Level'}
            {mode === 'political' && 'Political View'}
          </span>
        </div>
        <div className="space-y-2">
          {mode === 'political' ? (
             <div className="flex flex-wrap gap-2 max-w-[120px]">
               <span className="w-3 h-3 rounded-full bg-yellow-400" />
               <span className="w-3 h-3 rounded-full bg-green-400" />
               <span className="w-3 h-3 rounded-full bg-red-400" />
               <span className="w-3 h-3 rounded-full bg-blue-400" />
               <span className="w-3 h-3 rounded-full bg-pink-400" />
               <span className="text-xs text-gati-muted w-full mt-1">States & UTs</span>
             </div>
          ) : mode === 'risk' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-orange-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-red-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">Critical</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">≥98%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-cyan-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">95-98%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">90-95%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-red-500 shadow-sm" />
                <span className="text-xs font-medium text-gati-text">&lt;90%</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* SVG Map */}
      <motion.svg
        viewBox="0 0 600 800"
        className="w-full h-full transition-all duration-700"
        style={{ 
          transform: `perspective(1000px) rotateX(${mode === 'political' ? 10 : 0}deg) scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Outer glow filter */}
          <filter id="state-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Drop shadow */}
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(10,36,99,0.2)" floodOpacity="0.3"/>
          </filter>
          
          {/* Selected state glow */}
          <filter id="selected-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="glow"/>
            <feFlood floodColor="#00B4D8" floodOpacity="0.6"/>
            <feComposite in2="glow" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* 3D-like gradient for states */}
          <linearGradient id="state-3d-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>

          {/* Ocean gradient */}
          <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F7FF" />
            <stop offset="100%" stopColor="#B8E8F5" />
          </linearGradient>
        </defs>
        
        {/* India outline shadow */}
        <g filter="url(#drop-shadow)">
          {/* 3D Extrusion (Depth) Layer */}
          <g transform="translate(4, 6)">
             {indiaStatesData.map((state) => (
               <path 
                 key={`depth-${state.id}`}
                 d={state.path}
                 className="fill-slate-900/20"
                 stroke="none"
               />
             ))}
          </g>

          {/* Neighboring countries labels */}
          <text x="60" y="50" className="fill-slate-400 text-[10px] font-medium">PAKISTAN</text>
          <text x="320" y="35" className="fill-slate-400 text-[10px] font-medium">CHINA</text>
          <text x="385" y="135" className="fill-slate-400 text-[10px] font-medium">NEPAL</text>
          <text x="455" y="155" className="fill-slate-400 text-[10px] font-medium">BHUTAN</text>
          <text x="520" y="290" className="fill-slate-400 text-[10px] font-medium">MYANMAR</text>
          <text x="435" y="415" className="fill-slate-400 text-[10px] font-medium">BAY OF BENGAL</text>
          <text x="28" y="485" className="fill-slate-400 text-[10px] font-medium">ARABIAN SEA</text>
          <text x="185" y="790" className="fill-slate-400 text-[10px] font-medium">INDIAN OCEAN</text>
          <text x="285" y="790" className="fill-slate-400 text-[10px] font-medium">SRI LANKA</text>
          
          {/* States */}
          {indiaStatesData.map((state, index) => {
            const isHovered = hoveredState === state.id
            const isSelected = selectedState === state.id
            const hasData = stateData.some(s => s.id === state.id)
            
            return (
              <g key={state.id}>
                <motion.path
                  d={state.path}
                  className={`
                    ${isSelected ? 'fill-gati-accent' : isHovered ? getHoverColor(state.id) : getStateColor(state.id)}
                    stroke-white 
                    cursor-pointer
                    transition-colors duration-200
                  `}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                  strokeLinejoin="round"
                  filter={isSelected ? 'url(#selected-glow)' : undefined}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ 
                    opacity: 1, 
                    pathLength: 1,
                    scale: isSelected ? 1.02 : isHovered ? 1.01 : 1,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.02,
                    scale: { duration: 0.2 }
                  }}
                  onMouseEnter={() => interactive && setHoveredState(state.id)}
                  onMouseLeave={() => interactive && setHoveredState(null)}
                  onClick={() => handleStateClick(state.id)}
                />
                
                {/* 3D overlay gradient */}
                <motion.path
                  d={state.path}
                  fill="url(#state-3d-gradient)"
                  className="pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: index * 0.02 + 0.3 }}
                />
                
                {/* State labels */}
                {showLabels && zoom >= 0.8 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered || isSelected ? 1 : 0.8 }}
                    transition={{ delay: index * 0.02 + 0.4 }}
                  >
                    <text
                      x={state.cx}
                      y={state.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`
                        font-bold pointer-events-none select-none
                        ${isSelected || isHovered ? 'fill-white' : 'fill-slate-700'}
                      `}
                      style={{ 
                        fontSize: state.id === 'DL' || state.id === 'GA' || state.id === 'SK' || state.id === 'DD' || state.id === 'DN' || state.id === 'PY' || state.id === 'LD' ? '6px' : '8px',
                        textShadow: isSelected || isHovered ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 1px rgba(255,255,255,0.8)'
                      }}
                    >
                      {state.id}
                    </text>
                  </motion.g>
                )}
              </g>
            )
          })}
        </g>
      </motion.svg>
      
      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredState && !selectedState && interactive && (
          <motion.div 
            className="absolute bottom-4 left-4 z-30 bg-white rounded-xl shadow-xl p-4 border border-gray-100 min-w-[200px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {(() => {
              const stateInfo = indiaStatesData.find(s => s.id === hoveredState)
              const data = getStateData(hoveredState)
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gati-accent" />
                    <h3 className="font-bold text-gati-text">{stateInfo?.name || hoveredState}</h3>
                  </div>
                  {stateInfo?.capital && (
                    <p className="text-xs text-gati-muted mb-2">Capital: {stateInfo.capital}</p>
                  )}
                  {data && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-xs text-gati-muted">Coverage</span>
                        <span className="text-xs font-semibold text-gati-text">{data.coverage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gati-muted">Freshness</span>
                        <span className="text-xs font-semibold text-gati-text">{data.freshness}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gati-muted">Risk Level</span>
                        <span className={`text-xs font-semibold capitalize ${
                          data.risk === 'low' ? 'text-emerald-600' :
                          data.risk === 'medium' ? 'text-amber-600' :
                          data.risk === 'high' ? 'text-orange-600' : 'text-red-600'
                        }`}>{data.risk}</span>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selected state detail panel */}
      <AnimatePresence>
        {selectedState && selectedStateData && interactive && (
          <motion.div 
            className="absolute top-4 right-16 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gati-primary to-gati-secondary p-4 text-white relative">
              <button 
                onClick={() => setSelectedState(null)}
                className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide opacity-80">State Details</span>
              </div>
              <h3 className="text-xl font-bold">{selectedStateInfo?.name}</h3>
              {selectedStateInfo?.capital && (
                <p className="text-sm opacity-80 mt-1">Capital: {selectedStateInfo.capital}</p>
              )}
            </div>
            
            {/* Stats */}
            <div className="p-4 space-y-4">
              {/* Coverage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gati-accent" />
                    <span className="text-sm font-medium text-gati-text">Coverage</span>
                  </div>
                  <span className="text-lg font-bold text-gati-primary">{selectedStateData.coverage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-gati-accent to-gati-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedStateData.coverage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
              
              {/* Freshness */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gati-text">Data Freshness</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{selectedStateData.freshness}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedStateData.freshness}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              </div>
              
              {/* Enrolments */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gati-muted">Total Enrolments</span>
                  <span className="text-sm font-bold text-gati-text">{formatIndianNumber(selectedStateData.enrolments)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gati-muted">Monthly Updates</span>
                  <span className="text-sm font-bold text-gati-text">{formatIndianNumber(selectedStateData.updates)}</span>
                </div>
              </div>
              
              {/* Risk Badge */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      selectedStateData.risk === 'low' ? 'text-emerald-500' :
                      selectedStateData.risk === 'medium' ? 'text-amber-500' :
                      selectedStateData.risk === 'high' ? 'text-orange-500' : 'text-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gati-text">Risk Level</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedStateData.risk === 'low' ? 'bg-emerald-100 text-emerald-700' :
                    selectedStateData.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                    selectedStateData.risk === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedStateData.risk}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom info bar */}
      {interactive && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-100">
          <span className="text-xs text-gati-muted">
            {indiaStatesData.length} States & UTs
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-medium text-gati-primary">
            Click state for details
          </span>
        </div>
      )}
    </div>
  )
}
