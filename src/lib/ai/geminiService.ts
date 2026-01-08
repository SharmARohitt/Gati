/**
 * GATI AI Service - Real AI Integration
 * Uses Google Gemini for natural language understanding
 * NO fake responses, NO hardcoded logic
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export interface MLPrediction {
  value: number | string;
  confidence: number;
  explanation: string;
  factors: string[];
  timestamp: string;
}

export interface AnomalyPrediction extends MLPrediction {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

export interface RiskPrediction extends MLPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  topFactors: { name: string; contribution: number }[];
  recommendations: string[];
}

export interface ForecastPrediction extends MLPrediction {
  forecastHorizon: number;
  predictions: { date: string; value: number; lower: number; upper: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number;
}

export interface AIResponse {
  success: boolean;
  response: string;
  context?: {
    anomalies?: AnomalyPrediction[];
    risks?: RiskPrediction[];
    forecasts?: ForecastPrediction[];
  };
  sources?: string[];
  timestamp: string;
}

// ML API Configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Fetch real predictions from Python ML API
 */
export async function fetchAnomalyPredictions(): Promise<AnomalyPrediction[]> {
  try {
    const response = await fetch(`${ML_API_URL}/api/anomaly/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[AI Service] Failed to fetch anomalies:', error);
    return [];
  }
}

export async function fetchRiskPredictions(state?: string): Promise<RiskPrediction[]> {
  try {
    const response = await fetch(`${ML_API_URL}/api/risk/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
    
    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[AI Service] Failed to fetch risks:', error);
    return [];
  }
}

export async function fetchForecastPredictions(metric?: string, state?: string): Promise<ForecastPrediction | null> {
  try {
    const response = await fetch(`${ML_API_URL}/api/forecast/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, state, horizon_days: 30 })
    });
    
    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[AI Service] Failed to fetch forecast:', error);
    return null;
  }
}

/**
 * Check if ML API is available
 */
export async function checkMLAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Build context from real ML predictions for LLM
 */
export async function buildMLContext(): Promise<string> {
  const [anomalies, risks, forecast] = await Promise.all([
    fetchAnomalyPredictions(),
    fetchRiskPredictions(),
    fetchForecastPredictions()
  ]);
  
  let context = '## Current ML Model Outputs\n\n';
  
  // Anomalies
  if (anomalies.length > 0) {
    context += '### Detected Anomalies\n';
    anomalies.slice(0, 5).forEach((a, i) => {
      context += `${i + 1}. ${a.location}: ${a.severity} severity anomaly in ${a.metric} `;
      context += `(Expected: ${a.expectedValue}, Actual: ${a.actualValue}, Deviation: ${a.deviation}%)\n`;
      context += `   Confidence: ${(a.confidence * 100).toFixed(1)}%\n`;
    });
    context += '\n';
  } else {
    context += '### Anomalies: No significant anomalies detected currently.\n\n';
  }
  
  // Risks
  if (risks.length > 0) {
    context += '### Risk Assessment\n';
    const highRisk = risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    const mediumRisk = risks.filter(r => r.riskLevel === 'medium');
    const lowRisk = risks.filter(r => r.riskLevel === 'low');
    
    context += `- Critical/High Risk States: ${highRisk.length}\n`;
    context += `- Medium Risk States: ${mediumRisk.length}\n`;
    context += `- Low Risk States: ${lowRisk.length}\n`;
    
    if (highRisk.length > 0) {
      context += '\nHigh-Risk Details:\n';
      highRisk.slice(0, 3).forEach((r, i) => {
        context += `${i + 1}. State: ${r.value} - Risk Score: ${r.riskScore.toFixed(2)}\n`;
        context += `   Top Factors: ${r.topFactors.slice(0, 3).map(f => `${f.name} (${(f.contribution * 100).toFixed(1)}%)`).join(', ')}\n`;
      });
    }
    context += '\n';
  }
  
  // Forecast
  if (forecast) {
    context += '### 30-Day Forecast\n';
    context += `Trend: ${forecast.trend} (Strength: ${(forecast.trendStrength * 100).toFixed(1)}%)\n`;
    if (forecast.predictions && forecast.predictions.length > 0) {
      const first = forecast.predictions[0];
      const last = forecast.predictions[forecast.predictions.length - 1];
      context += `Prediction Range: ${first.date} to ${last.date}\n`;
      context += `Expected Values: ${first.value.toFixed(0)} → ${last.value.toFixed(0)}\n`;
    }
  }
  
  return context;
}

/**
 * Gemini AI Chat - Real LLM integration
 */
export class GATIGeminiAI {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-1.0-pro' });
      this.isInitialized = true;
    } else {
      console.warn('[GATI AI] Gemini API key not found');
    }
  }
  
  async chat(userQuery: string, includeMLContext: boolean = true): Promise<AIResponse> {
    if (!this.isInitialized || !this.model) {
      return {
        success: false,
        response: 'AI service not configured. Please set GEMINI_API_KEY in environment.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Build context from real ML predictions
      let mlContext = '';
      if (includeMLContext) {
        mlContext = await buildMLContext();
      }
      
      // System prompt
      const systemPrompt = `You are GATI AI Assistant, an expert in analyzing Aadhaar governance data for India.

Your role:
- Analyze real machine learning predictions from our trained models
- Provide clear, actionable insights for government officials
- Always base your answers on the provided data context
- If data is unavailable, say so honestly
- Be specific with numbers and locations when available
- Suggest concrete actions when appropriate

Important: You must ONLY use information from the provided context. Do NOT make up statistics or predictions.

${mlContext}

---
User Question: ${userQuery}

Provide a helpful, accurate response based solely on the data above:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        response: text,
        sources: ['ML Anomaly Detection', 'ML Risk Scoring', 'ML Forecasting'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[GATI AI] Gemini error:', error);
      return {
        success: false,
        response: `AI processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async explainPrediction(
    predictionType: 'anomaly' | 'risk' | 'forecast',
    entityId: string
  ): Promise<AIResponse> {
    if (!this.isInitialized || !this.model) {
      return {
        success: false,
        response: 'AI service not configured.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Fetch explanation from Python ML API
      const response = await fetch(`${ML_API_URL}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_type: predictionType,
          entity_id: entityId,
          prediction_value: 0 // Will be filled by API
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch explanation from ML API');
      }
      
      const explanation = await response.json();
      
      // Use Gemini to make explanation more readable
      const prompt = `Convert this technical ML explanation into clear, simple language for a government official:

Technical Explanation:
${JSON.stringify(explanation, null, 2)}

Provide a 2-3 sentence summary explaining:
1. What the prediction means
2. Why this conclusion was reached
3. What action should be considered`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      
      return {
        success: true,
        response: text,
        context: explanation,
        sources: ['SHAP Explainability', 'ML Model Internals'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[GATI AI] Explanation error:', error);
      return {
        success: false,
        response: `Could not generate explanation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
let aiInstance: GATIGeminiAI | null = null;

export function getGATIAI(): GATIGeminiAI {
  if (!aiInstance) {
    aiInstance = new GATIGeminiAI();
  }
  return aiInstance;
}
