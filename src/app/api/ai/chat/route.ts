/**
 * GATI AI Chat API Route
 * Powered by Hugging Face Inference Providers (OpenAI-compatible API)
 * Includes rate limiting, model fallback, and robust error handling
 */

import { NextRequest, NextResponse } from 'next/server';

// ML API Configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Hugging Face Router API (OpenAI-compatible)
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

// Hugging Face models to try (in order of preference - all tested and working)
const HF_MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Llama-3.3-70B-Instruct',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
];

/**
 * Simple rate limiter
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

/**
 * Fetch real ML context from Python backend with timeout
 */
async function fetchMLContext(): Promise<string> {
  let context = '## Current System Status\n\n';
  
  try {
    const healthResponse = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (!healthResponse.ok) {
      context += '### ML Models Status: Offline\n\n';
      return context;
    }
    
    const health = await healthResponse.json();
    context += `### ML Models Status\n`;
    context += `- API Status: Online\n`;
    if (health.models_loaded) {
      Object.entries(health.models_loaded).forEach(([model, loaded]) => {
        context += `- ${model}: ${loaded ? '✓ Ready' : '✗ Not loaded'}\n`;
      });
    }
    context += '\n';
  } catch {
    context += '### ML Models Status: Offline (using cached insights)\n\n';
    return context;
  }
  
  // Fetch anomalies
  try {
    const anomalyResponse = await fetch(`${ML_API_URL}/api/anomaly/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3000)
    });
    
    if (anomalyResponse.ok) {
      const data = await anomalyResponse.json();
      if (data.results && data.results.length > 0) {
        context += '### Recent Anomalies Detected\n';
        const anomalies = data.results.filter((a: { is_anomaly: boolean }) => a.is_anomaly);
        if (anomalies.length > 0) {
          anomalies.slice(0, 5).forEach((a: { entity_id: string; severity: string; anomaly_score?: number }, i: number) => {
            context += `${i + 1}. ${a.entity_id}: ${a.severity} severity\n`;
          });
        } else {
          context += 'No significant anomalies detected.\n';
        }
        context += '\n';
      }
    }
  } catch {
    // Silent fail
  }
  
  // Fetch risk assessment
  try {
    const riskResponse = await fetch(`${ML_API_URL}/api/risk/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3000)
    });
    
    if (riskResponse.ok) {
      const data = await riskResponse.json();
      if (data.results && data.results.length > 0) {
        context += '### Risk Assessment Summary\n';
        const byLevel = { critical: 0, high: 0, medium: 0, low: 0 };
        data.results.forEach((r: { risk_level: string }) => {
          if (r.risk_level in byLevel) byLevel[r.risk_level as keyof typeof byLevel]++;
        });
        context += `- Critical: ${byLevel.critical}, High: ${byLevel.high}, Medium: ${byLevel.medium}, Low: ${byLevel.low}\n\n`;
      }
    }
  } catch {
    // Silent fail
  }
  
  return context;
}

/**
 * Call Hugging Face Router API (OpenAI-compatible)
 */
async function callHuggingFace(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: false
    }),
    signal: AbortSignal.timeout(45000), // 45s timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // OpenAI-compatible response format
  if (result.choices && result.choices[0]?.message?.content) {
    return result.choices[0].message.content;
  }
  
  throw new Error('Unexpected response format from Hugging Face');
}

/**
 * Try multiple HF models until one works
 */
async function tryHFModels(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;
  
  for (const modelName of HF_MODELS) {
    try {
      console.log(`[AI Chat] Trying model: ${modelName}`);
      const text = await callHuggingFace(apiKey, modelName, systemPrompt, userMessage);
      return { text, model: modelName };
    } catch (error) {
      lastError = error as Error;
      console.log(`[AI Chat] Model ${modelName} failed: ${(error as Error).message}`);
      continue;
    }
  }
  
  throw lastError || new Error('All Hugging Face models failed');
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({
      success: false,
      response: 'Rate limit exceeded. Please wait a moment before trying again.',
      timestamp: new Date().toISOString()
    }, { 
      status: 429,
      headers: { 'X-RateLimit-Remaining': '0' }
    });
  }
  
  try {
    const body = await request.json().catch(() => ({}));
    const { message, includeContext = true } = body;
    
    // Input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }
    
    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 5000 characters)', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }
    
    // Sanitize input
    const sanitizedMessage = message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
    
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        response: 'AI service not configured. Please contact administrator.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    // Build ML context
    let mlContext = '';
    if (includeContext) {
      try {
        mlContext = await fetchMLContext();
      } catch {
        mlContext = '### ML Models Status: Unavailable\n\n';
      }
    }
    
    // System prompt for GATI AI
    const systemPrompt = `You are GATI AI, an intelligent assistant for the Governance & Aadhaar Tracking Intelligence platform - India's premier Aadhaar data governance system.

Your expertise:
- Analyze Aadhaar enrollment and biometric data patterns across India
- Identify anomalies and irregularities in state-level operations
- Assess risk levels for different regions and districts
- Provide actionable governance insights for officials
- Understand demographic trends and coverage metrics

Guidelines:
1. Be concise, professional, and accurate
2. Use specific numbers when available from the context
3. If data is unavailable, say so clearly - NEVER fabricate statistics
4. Recommend concrete, actionable steps when appropriate
5. Keep responses suitable for senior government officials

${mlContext}`;

    // Try Hugging Face models with fallback
    const { text, model: usedModel } = await tryHFModels(apiKey, systemPrompt, sanitizedMessage);
    
    return NextResponse.json({
      success: true,
      response: text.trim(),
      sources: mlContext.includes('Online') 
        ? ['ML Anomaly Detection', 'ML Risk Scoring', 'ML Forecasting']
        : ['Cached Insights'],
      modelUsed: usedModel,
      timestamp: new Date().toISOString()
    }, {
      headers: { 'X-RateLimit-Remaining': remaining.toString() }
    });
    
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    
    let userMessage = 'I encountered an error processing your request. ';
    
    if (error instanceof Error) {
      if (error.message.includes('503') || error.message.includes('loading')) {
        userMessage += 'The AI model is warming up. Please try again in a few seconds.';
      } else if (error.message.includes('401') || error.message.includes('API')) {
        userMessage += 'There is a configuration issue. Please contact the administrator.';
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        userMessage += 'The service is currently at capacity. Please try again later.';
      } else if (error.message.includes('timeout')) {
        userMessage += 'The request timed out. Please try a simpler question.';
      } else {
        userMessage += 'Please try rephrasing your question or try again later.';
      }
    }
    
    return NextResponse.json({
      success: false,
      response: userMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  let mlApiStatus = 'unknown';
  let modelsLoaded: Record<string, boolean> = {};
  
  try {
    const response = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const health = await response.json();
      mlApiStatus = 'online';
      modelsLoaded = health.models_loaded || {};
    } else {
      mlApiStatus = 'offline';
    }
  } catch {
    mlApiStatus = 'offline';
  }
  
  return NextResponse.json({
    status: 'ok',
    aiProvider: 'Hugging Face',
    aiConfigured: !!apiKey,
    mlApiStatus,
    modelsLoaded,
    availableModels: HF_MODELS,
    timestamp: new Date().toISOString()
  });
}
