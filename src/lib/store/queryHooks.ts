/**
 * GATI Query Hooks with React Query
 * Centralized data fetching with caching, revalidation, and optimistic updates
 */

'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  // States & Districts
  states: ['states'] as const,
  stateDetails: (stateCode: string) => ['states', stateCode] as const,
  districts: (stateCode: string) => ['districts', stateCode] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  analyticsOverview: ['analytics', 'overview'] as const,
  analyticsByState: (stateCode: string) => ['analytics', 'state', stateCode] as const,
  
  // Anomalies
  anomalies: ['anomalies'] as const,
  anomalyDetails: (id: string) => ['anomalies', id] as const,
  anomaliesByState: (stateCode: string) => ['anomalies', 'state', stateCode] as const,
  
  // ML Models
  mlStatus: ['ml', 'status'] as const,
  mlPipeline: ['ml', 'pipeline'] as const,
  mlPredictions: ['ml', 'predictions'] as const,
  mlForecast: (metric: string, state?: string) => ['ml', 'forecast', metric, state] as const,
  
  // User & Auth
  user: ['user'] as const,
  session: ['session'] as const,
  
  // Health
  health: ['health'] as const,
  
  // Audit
  auditLogs: ['audit'] as const,
  auditLogsByUser: (userId: string) => ['audit', 'user', userId] as const,
}

// ============================================
// API Helpers
// ============================================

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================
// States Queries
// ============================================

export interface StatesResponse {
  success: boolean
  data: {
    states: Array<{
      code: string
      name: string
      coverage: number
      freshness: number
      riskLevel: string
    }>
    overview: {
      totalEnrolments: number
      totalUpdates: number
      nationalCoverage: number
    }
  }
}

export function useStates() {
  return useQuery({
    queryKey: queryKeys.states,
    queryFn: () => fetchAPI<StatesResponse>('/api/states'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useStateDetails(stateCode: string) {
  return useQuery({
    queryKey: queryKeys.stateDetails(stateCode),
    queryFn: () => fetchAPI<{ success: boolean; data: Record<string, unknown> }>(`/api/states/${stateCode}`),
    enabled: !!stateCode,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Analytics Queries
// ============================================

export interface AnalyticsResponse {
  success: boolean
  data: {
    overview: {
      totalRecords: number
      processedToday: number
      anomaliesDetected: number
      accuracy: number
    }
    trends: Array<{
      date: string
      value: number
    }>
  }
}

export function useAnalytics(filters?: { state?: string; dateRange?: string }) {
  return useQuery({
    queryKey: [...queryKeys.analytics, filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.state) params.set('state', filters.state)
      if (filters?.dateRange) params.set('dateRange', filters.dateRange)
      return fetchAPI<AnalyticsResponse>(`/api/analytics?${params}`)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================
// Anomaly Queries
// ============================================

export interface AnomalyResponse {
  success: boolean
  data: {
    anomalies: Array<{
      id: string
      entityId: string
      type: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      score: number
      detectedAt: string
      description: string
    }>
    summary: {
      total: number
      critical: number
      high: number
      medium: number
      low: number
    }
  }
}

export function useAnomalies(options?: { state?: string; severity?: string }) {
  return useQuery({
    queryKey: [...queryKeys.anomalies, options],
    queryFn: () => {
      const params = new URLSearchParams()
      if (options?.state) params.set('state', options.state)
      if (options?.severity) params.set('severity', options.severity)
      return fetchAPI<AnomalyResponse>(`/api/ai/anomaly?${params}`)
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// ============================================
// ML Model Queries
// ============================================

export interface MLStatusResponse {
  success: boolean
  data: {
    models: Array<{
      name: string
      type: string
      status: 'active' | 'training' | 'error'
      version: string
      accuracy: number
      lastTrained: string
    }>
    pipeline: {
      status: 'healthy' | 'degraded' | 'error'
      lastCheck: string
    }
  }
}

export function useMLStatus() {
  return useQuery({
    queryKey: queryKeys.mlStatus,
    queryFn: () => fetchAPI<MLStatusResponse>('/api/ml/pipeline?action=status'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

export interface ForecastResponse {
  success: boolean
  data: {
    metric: string
    state: string | null
    forecast: Array<{
      date: string
      predicted: number
      lower: number
      upper: number
    }>
    trend: 'increasing' | 'decreasing' | 'stable'
    confidence: number
  }
}

export function useForecast(metric: string, state?: string) {
  return useQuery({
    queryKey: queryKeys.mlForecast(metric, state),
    queryFn: () => {
      const params = new URLSearchParams({ metric })
      if (state) params.set('state', state)
      return fetchAPI<ForecastResponse>(`/api/ai/forecast?${params}`)
    },
    enabled: !!metric,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============================================
// Health Query
// ============================================

export interface HealthResponse {
  success: boolean
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    api: { status: string; latency?: number }
    ml: { status: string; modelsLoaded?: number }
    database: { status: string }
  }
  uptime: number
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => fetchAPI<HealthResponse>('/api/health'),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 1,
  })
}

// ============================================
// Mutations
// ============================================

// Train ML Model
export function useTrainModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (modelType: string) =>
      fetchAPI<{ success: boolean; jobId: string }>('/api/ml/pipeline', {
        method: 'POST',
        body: JSON.stringify({ action: 'train', modelType }),
      }),
    onSuccess: () => {
      // Invalidate ML status to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.mlStatus })
    },
  })
}

// Report Anomaly
export function useReportAnomaly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { anomalyId: string; action: string; notes?: string }) =>
      fetchAPI<{ success: boolean }>('/api/ai/anomaly', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.anomalies })
    },
  })
}

// AI Chat
export interface ChatResponse {
  success: boolean
  message: string
  model: string
  provider: string
}

export function useAIChat() {
  return useMutation({
    mutationFn: (data: { message: string; context?: Record<string, unknown> }) =>
      fetchAPI<ChatResponse>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })
}

// ============================================
// Prefetch Helpers
// ============================================

export function usePrefetchStates() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.states,
      queryFn: () => fetchAPI<StatesResponse>('/api/states'),
    })
  }
}

export function usePrefetchAnalytics() {
  const queryClient = useQueryClient()

  return (state?: string) => {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.analytics, { state }],
      queryFn: () => {
        const params = new URLSearchParams()
        if (state) params.set('state', state)
        return fetchAPI<AnalyticsResponse>(`/api/analytics?${params}`)
      },
    })
  }
}

// ============================================
// Query Provider Component
// ============================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export { QueryClient, QueryClientProvider }

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}
