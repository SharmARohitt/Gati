/**
 * GATI ML Status Component
 * Shows real-time status of ML models and API
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain
} from 'lucide-react'

interface ModelStatus {
  name: string
  loaded: boolean
  version?: string
}

interface MLStatusData {
  apiOnline: boolean
  geminiConfigured: boolean
  models: ModelStatus[]
  lastChecked: Date
}

export function MLStatusBadge() {
  const [status, setStatus] = useState<MLStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/chat', { method: 'GET' })
      const data = await response.json()
      
      setStatus({
        apiOnline: data.mlApiStatus === 'online',
        geminiConfigured: data.geminiConfigured,
        models: [
          { name: 'Anomaly Detector', loaded: data.mlApiStatus === 'online' },
          { name: 'Risk Scorer', loaded: data.mlApiStatus === 'online' },
          { name: 'Forecaster', loaded: data.mlApiStatus === 'online' },
        ],
        lastChecked: new Date()
      })
    } catch {
      setStatus({
        apiOnline: false,
        geminiConfigured: false,
        models: [],
        lastChecked: new Date()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="text-xs font-medium text-gray-600">Checking...</span>
      </div>
    )
  }

  const allOnline = status?.apiOnline && status?.geminiConfigured
  const partialOnline = status?.apiOnline || status?.geminiConfigured

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
        allOnline 
          ? 'bg-emerald-50 hover:bg-emerald-100' 
          : partialOnline 
            ? 'bg-amber-50 hover:bg-amber-100'
            : 'bg-red-50 hover:bg-red-100'
      }`}
      onClick={checkStatus}
      title="Click to refresh status"
    >
      <span className={`w-2 h-2 rounded-full ${
        allOnline 
          ? 'bg-emerald-500 animate-pulse' 
          : partialOnline 
            ? 'bg-amber-500'
            : 'bg-red-500'
      }`} />
      <span className={`text-xs font-medium ${
        allOnline 
          ? 'text-emerald-700' 
          : partialOnline 
            ? 'text-amber-700'
            : 'text-red-700'
      }`}>
        {allOnline ? 'AI Online' : partialOnline ? 'Partial' : 'AI Offline'}
      </span>
    </div>
  )
}

export function MLStatusPanel() {
  const [status, setStatus] = useState<MLStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      // Check chat API (includes Gemini status)
      const chatResponse = await fetch('/api/ai/chat', { method: 'GET' })
      const chatData = await chatResponse.json()
      
      // Check individual model endpoints
      const [anomalyRes, riskRes, forecastRes] = await Promise.allSettled([
        fetch('/api/ai/anomaly', { method: 'GET' }),
        fetch('/api/ai/risk', { method: 'GET' }),
        fetch('/api/ai/forecast', { method: 'GET' })
      ])
      
      const models: ModelStatus[] = []
      
      if (anomalyRes.status === 'fulfilled') {
        const data = await anomalyRes.value.json()
        models.push({ 
          name: 'Anomaly Detection', 
          loaded: data.modelLoaded || data.status === 'available',
          version: 'Isolation Forest'
        })
      }
      
      if (riskRes.status === 'fulfilled') {
        const data = await riskRes.value.json()
        models.push({ 
          name: 'Risk Scoring', 
          loaded: data.modelLoaded || data.status === 'available',
          version: 'XGBoost'
        })
      }
      
      if (forecastRes.status === 'fulfilled') {
        const data = await forecastRes.value.json()
        models.push({ 
          name: 'Time Series Forecast', 
          loaded: data.modelLoaded || data.status === 'available',
          version: 'Prophet'
        })
      }
      
      setStatus({
        apiOnline: chatData.mlApiStatus === 'online',
        geminiConfigured: chatData.geminiConfigured,
        models,
        lastChecked: new Date()
      })
    } catch {
      setStatus({
        apiOnline: false,
        geminiConfigured: false,
        models: [],
        lastChecked: new Date()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            status?.apiOnline && status?.geminiConfigured 
              ? 'bg-emerald-100' 
              : 'bg-amber-100'
          }`}>
            <Brain className={`w-5 h-5 ${
              status?.apiOnline && status?.geminiConfigured 
                ? 'text-emerald-600' 
                : 'text-amber-600'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ML System Status</h3>
            <p className="text-sm text-gray-500">
              {status?.lastChecked 
                ? `Last checked: ${status.lastChecked.toLocaleTimeString()}`
                : 'Checking...'
              }
            </p>
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); checkStatus(); }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-3">
              {/* Gemini AI Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Gemini AI (LLM)</span>
                </div>
                {status?.geminiConfigured ? (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Not Configured</span>
                  </div>
                )}
              </div>
              
              {/* Python ML API Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Python ML API</span>
                </div>
                {status?.apiOnline ? (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Offline</span>
                  </div>
                )}
              </div>
              
              {/* Individual Models */}
              {status?.models && status.models.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">ML Models</p>
                  {status.models.map((model, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{model.name}</span>
                      <div className="flex items-center gap-2">
                        {model.version && (
                          <span className="text-xs text-gray-400">{model.version}</span>
                        )}
                        {model.loaded ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Instructions if offline */}
              {!status?.apiOnline && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>To start the ML API:</strong><br />
                    <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">
                      cd ml && python -m uvicorn api.main:app --reload
                    </code>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MLStatusPanel
