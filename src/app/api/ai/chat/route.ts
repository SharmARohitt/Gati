/**
 * GATI AI Chat API Route
 * Real AI powered by Google Gemini with ML context
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ML API Configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Fetch real ML context from Python backend
 */
async function fetchMLContext(): Promise<string> {
  let context = '## Current System Status\n\n';
  
  try {
    // Try to fetch health status
    const healthResponse = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      context += `### ML Models Status\n`;
      context += `- API Status: Online\n`;
      if (health.models) {
        Object.entries(health.models).forEach(([model, status]) => {
          context += `- ${model}: ${status}\n`;
        });
      }
      context += '\n';
    }
  } catch {
    context += '### ML Models Status: Offline (predictions unavailable)\n\n';
  }
  
  try {
    // Fetch latest anomalies
    const anomalyResponse = await fetch(`${ML_API_URL}/api/anomaly/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000)
    });
    
    if (anomalyResponse.ok) {
      const anomalyData = await anomalyResponse.json();
      if (anomalyData.results && anomalyData.results.length > 0) {
        context += '### Recent Anomalies Detected\n';
        anomalyData.results.slice(0, 5).forEach((a: any, i: number) => {
          context += `${i + 1}. ${a.state || 'Unknown'}: ${a.anomaly_type || 'Anomaly'} - Score: ${a.score?.toFixed(3) || 'N/A'}\n`;
        });
        context += '\n';
      }
    }
  } catch {
    // Silently handle ML API errors
  }
  
  try {
    // Fetch risk assessment
    const riskResponse = await fetch(`${ML_API_URL}/api/risk/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000)
    });
    
    if (riskResponse.ok) {
      const riskData = await riskResponse.json();
      if (riskData.results && riskData.results.length > 0) {
        context += '### Risk Assessment Summary\n';
        const highRisk = riskData.results.filter((r: any) => r.risk_level === 'high' || r.risk_level === 'critical');
        const medRisk = riskData.results.filter((r: any) => r.risk_level === 'medium');
        context += `- High/Critical Risk Regions: ${highRisk.length}\n`;
        context += `- Medium Risk Regions: ${medRisk.length}\n`;
        if (highRisk.length > 0) {
          context += `- Top Risk States: ${highRisk.slice(0, 3).map((r: any) => r.state).join(', ')}\n`;
        }
        context += '\n';
      }
    }
  } catch {
    // Silently handle ML API errors
  }
  
  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { message, includeContext = true } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        response: 'AI service not configured. Please contact administrator.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.0-pro' });
    
    // Build ML context
    let mlContext = '';
    if (includeContext) {
      mlContext = await fetchMLContext();
    }
    
    // Create prompt with system instructions
    const systemPrompt = `You are GATI AI, an intelligent assistant for the Governance & Aadhaar Tracking Intelligence platform.

Your capabilities:
- Analyze Aadhaar enrollment and biometric data patterns
- Identify anomalies in state-level operations
- Assess risk levels for different regions
- Provide actionable insights for government officials

Guidelines:
1. Be concise but comprehensive
2. Use specific numbers when available from context
3. If data is not available, say so clearly - NEVER make up statistics
4. Recommend concrete actions when appropriate
5. Keep responses professional and suitable for government officials

${mlContext}

---
User Query: ${message}

Respond helpfully based on available data:`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();
    
    return NextResponse.json({
      success: true,
      response: text,
      sources: ['ML Anomaly Detection', 'ML Risk Scoring', 'ML Forecasting'],
      modelUsed: 'gemini-1.0-pro',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    
    return NextResponse.json({
      success: false,
      response: `AI processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  // Health check endpoint
  const apiKey = process.env.GEMINI_API_KEY;
  
  let mlApiStatus = 'unknown';
  try {
    const response = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(3000)
    });
    mlApiStatus = response.ok ? 'online' : 'offline';
  } catch {
    mlApiStatus = 'offline';
  }
  
  return NextResponse.json({
    status: 'ok',
    geminiConfigured: !!apiKey,
    mlApiStatus,
    timestamp: new Date().toISOString()
  });
}
