/**
 * GATI ML API Client
 * ==================
 * This module provides a TypeScript interface to the real Python ML API.
 * Use this instead of the heuristic-based functions for production.
 * 
 * The heuristic functions in other files (anomalyDetection.ts, riskScoring.ts)
 * are kept as fallbacks when ML API is unavailable.
 */

const ML_API_BASE = '/api/ai';

// ================== Types ==================

export interface MLAnomalyResult {
  entity_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  detected_at: string;
}

export interface MLRiskResult {
  entity_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  confidence: number;
  top_factors: string[];
  recommendations: string[];
}

export interface MLForecastPoint {
  date: string;
  predicted_value: number;
  lower_bound: number | null;
  upper_bound: number | null;
}

export interface MLForecastResult {
  metric: string;
  state: string | null;
  forecast: MLForecastPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_strength: number;
  model_version: string;
}

export interface MLExplanation {
  summary: string;
  feature_contributions: Array<{
    feature: string;
    contribution: number;
    direction: 'positive' | 'negative';
  }>;
  methodology: string;
}

export interface MLAPIStatus {
  isOnline: boolean;
  geminiConfigured: boolean;
  modelsLoaded: {
    anomaly: boolean;
    risk: boolean;
    forecast: boolean;
  };
}

// ================== API Functions ==================

/**
 * Check if ML API is available
 */
export async function checkMLAPIStatus(): Promise<MLAPIStatus> {
  try {
    const response = await fetch(`${ML_API_BASE}/chat`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isOnline: data.mlApiStatus === 'online',
        geminiConfigured: data.geminiConfigured,
        modelsLoaded: {
          anomaly: data.mlApiStatus === 'online',
          risk: data.mlApiStatus === 'online',
          forecast: data.mlApiStatus === 'online'
        }
      };
    }
  } catch {
    // Silently handle errors
  }
  
  return {
    isOnline: false,
    geminiConfigured: false,
    modelsLoaded: { anomaly: false, risk: false, forecast: false }
  };
}

/**
 * Detect anomalies using real ML model (Isolation Forest)
 */
export async function detectAnomaliesML(options?: {
  state?: string;
  threshold?: number;
}): Promise<{ success: boolean; results: MLAnomalyResult[]; modelVersion: string }> {
  try {
    const response = await fetch(`${ML_API_BASE}/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: options?.state,
        threshold: options?.threshold || 0.05
      })
    });
    
    const data = await response.json();
    return {
      success: data.success,
      results: data.results || [],
      modelVersion: data.modelVersion || 'unknown'
    };
  } catch (error) {
    console.error('[ML API] Anomaly detection failed:', error);
    return { success: false, results: [], modelVersion: 'error' };
  }
}

/**
 * Assess risk using real ML model (XGBoost)
 */
export async function assessRiskML(options?: {
  state?: string;
}): Promise<{ success: boolean; results: MLRiskResult[]; modelVersion: string }> {
  try {
    const response = await fetch(`${ML_API_BASE}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: options?.state
      })
    });
    
    const data = await response.json();
    return {
      success: data.success,
      results: data.results || [],
      modelVersion: data.modelVersion || 'unknown'
    };
  } catch (error) {
    console.error('[ML API] Risk assessment failed:', error);
    return { success: false, results: [], modelVersion: 'error' };
  }
}

/**
 * Get forecast using real ML model (Prophet)
 */
export async function forecastML(options?: {
  metric?: string;
  state?: string;
  horizonDays?: number;
}): Promise<{ success: boolean; forecast: MLForecastResult | null; modelVersion: string }> {
  try {
    const response = await fetch(`${ML_API_BASE}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: options?.metric || 'total_enrolments',
        state: options?.state,
        horizon_days: options?.horizonDays || 30
      })
    });
    
    const data = await response.json();
    return {
      success: data.success,
      forecast: data.forecast,
      modelVersion: data.modelVersion || 'unknown'
    };
  } catch (error) {
    console.error('[ML API] Forecast failed:', error);
    return { success: false, forecast: null, modelVersion: 'error' };
  }
}

/**
 * Get human-readable explanation for a prediction
 */
export async function explainPredictionML(options: {
  modelType: 'anomaly' | 'risk' | 'forecast';
  entityId: string;
  predictionValue?: number;
}): Promise<{ success: boolean; technical: MLExplanation | null; humanReadable: string | null }> {
  try {
    const response = await fetch(`${ML_API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelType: options.modelType,
        entityId: options.entityId,
        predictionValue: options.predictionValue || 0,
        humanReadable: true
      })
    });
    
    const data = await response.json();
    return {
      success: data.success,
      technical: data.technical,
      humanReadable: data.humanReadable
    };
  } catch (error) {
    console.error('[ML API] Explanation failed:', error);
    return { success: false, technical: null, humanReadable: null };
  }
}

/**
 * Chat with AI assistant (powered by Gemini + ML context)
 */
export async function chatWithAI(message: string, includeMLContext: boolean = true): Promise<{
  success: boolean;
  response: string;
  sources?: string[];
}> {
  try {
    const response = await fetch(`${ML_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        includeContext: includeMLContext
      })
    });
    
    const data = await response.json();
    return {
      success: data.success,
      response: data.response,
      sources: data.sources
    };
  } catch (error) {
    console.error('[ML API] Chat failed:', error);
    return {
      success: false,
      response: 'Unable to connect to AI service.'
    };
  }
}

/**
 * Utility: Use ML if available, fallback to heuristics
 */
export async function withMLFallback<T>(
  mlCall: () => Promise<{ success: boolean; results: T }>,
  heuristicFallback: () => T
): Promise<T> {
  const status = await checkMLAPIStatus();
  
  if (status.isOnline) {
    const result = await mlCall();
    if (result.success) {
      return result.results;
    }
  }
  
  // Fallback to heuristics
  console.info('[ML API] Using heuristic fallback');
  return heuristicFallback();
}
