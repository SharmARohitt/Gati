/**
 * GATI ML Risk Scoring API Route
 * Proxies requests to Python ML API for real risk assessment
 */

import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(`${ML_API_URL}/api/risk/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      results: data.results || data,
      modelVersion: data.model_version || 'unknown',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Risk API] Error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: 'ML API is offline. Please start the Python ML server.',
        results: [],
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const health = await response.json();
      return NextResponse.json({
        status: 'available',
        modelLoaded: health.models?.risk_scorer || false,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      status: 'unavailable',
      modelLoaded: false,
      timestamp: new Date().toISOString()
    });
    
  } catch {
    return NextResponse.json({
      status: 'offline',
      modelLoaded: false,
      error: 'ML API not reachable',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
