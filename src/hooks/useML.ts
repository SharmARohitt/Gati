/**
 * GATI AI Hooks - React hooks for real ML integration
 * These hooks call actual ML APIs - NO fake data
 */

import { useState, useCallback, useEffect } from 'react'

// Types matching the ML API responses
export interface AnomalyResult {
  entity_id: string
  is_anomaly: boolean
  anomaly_score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  explanation: string
  detected_at: string
}

export interface RiskResult {
  entity_id: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  confidence: number
  top_factors: string[]
  recommendations: string[]
}

export interface ForecastPoint {
  date: string
  predicted_value: number
  lower_bound: number | null
  upper_bound: number | null
}

export interface ForecastResult {
  metric: string
  state: string | null
  forecast: ForecastPoint[]
  trend: 'increasing' | 'decreasing' | 'stable'
  trend_strength: number
  model_version: string
}

export interface AIExplanation {
  technical: {
    summary: string
    feature_contributions: Array<{ feature: string; contribution: number }>
  }
  humanReadable: string | null
}

// Hook state types
interface UseMLResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to detect anomalies using real ML model
 */
export function useAnomalyDetection(options?: { 
  state?: string 
  autoFetch?: boolean 
}): UseMLResult<AnomalyResult[]> {
  const [data, setData] = useState<AnomalyResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: options?.state })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.results)
      } else {
        setError(result.error || 'Failed to fetch anomalies')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [options?.state])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      refresh()
    }
  }, [options?.autoFetch, refresh])

  return { data, isLoading, error, refresh }
}

/**
 * Hook to get risk assessments using real ML model
 */
export function useRiskAssessment(options?: { 
  state?: string 
  autoFetch?: boolean 
}): UseMLResult<RiskResult[]> {
  const [data, setData] = useState<RiskResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: options?.state })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.results)
      } else {
        setError(result.error || 'Failed to fetch risk assessment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [options?.state])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      refresh()
    }
  }, [options?.autoFetch, refresh])

  return { data, isLoading, error, refresh }
}

/**
 * Hook to get forecasts using real ML model
 */
export function useForecast(options?: { 
  metric?: string
  state?: string 
  horizonDays?: number
  autoFetch?: boolean 
}): UseMLResult<ForecastResult> {
  const [data, setData] = useState<ForecastResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metric: options?.metric || 'total_enrolments',
          state: options?.state,
          horizon_days: options?.horizonDays || 30
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.forecast)
      } else {
        setError(result.error || 'Failed to fetch forecast')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }, [options?.metric, options?.state, options?.horizonDays])

  useEffect(() => {
    if (options?.autoFetch !== false) {
      refresh()
    }
  }, [options?.autoFetch, refresh])

  return { data, isLoading, error, refresh }
}

/**
 * Hook to get AI explanations for predictions
 */
export function useAIExplanation(): {
  explain: (modelType: string, entityId: string, predictionValue?: number) => Promise<AIExplanation | null>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const explain = useCallback(async (
    modelType: string, 
    entityId: string, 
    predictionValue?: number
  ): Promise<AIExplanation | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modelType, 
          entityId, 
          predictionValue: predictionValue || 0,
          humanReadable: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        return {
          technical: result.technical,
          humanReadable: result.humanReadable
        }
      } else {
        setError(result.error || 'Failed to get explanation')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { explain, isLoading, error }
}

/**
 * Hook for AI chat functionality
 */
export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chat = useCallback(async (message: string): Promise<string> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          includeContext: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.response
      } else {
        setError(result.response || 'AI request failed')
        return 'I apologize, but I encountered an error processing your request.'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      return `Error: ${errorMessage}`
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { chat, isLoading, error }
}

/**
 * Hook to check ML system health
 */
export function useMLHealth() {
  const [isMLOnline, setIsMLOnline] = useState(false)
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkHealth = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/chat', { method: 'GET' })
      const data = await response.json()
      
      setIsMLOnline(data.mlApiStatus === 'online')
      setIsGeminiConfigured(data.geminiConfigured)
    } catch {
      setIsMLOnline(false)
      setIsGeminiConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return { isMLOnline, isGeminiConfigured, isLoading, checkHealth }
}
