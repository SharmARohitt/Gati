/**
 * GATI Forecasting API
 * ML server → NVIDIA (kimi-k2.6 → glm4.7) → Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { callAI } from '@/lib/ai/providers';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

async function aiForecast(metric: string, state: string | null, dataSummary: string): Promise<any> {
  const systemPrompt = `You are an Aadhaar data forecasting expert. Generate accurate 30-day forecasts based on real data. Return ONLY valid JSON — no markdown, no explanation.`;

  const userMessage = `Generate a 30-day forecast for ${metric}${state ? ` in ${state}` : ' nationally'}.

Real data:
${dataSummary}

Return this exact JSON structure (no markdown):
{"trend":"increasing|decreasing|stable","trend_strength":0.15,"confidence":0.87,"summary":"one sentence insight about the trend","forecast":[{"date":"YYYY-MM-DD","predicted_value":12345,"lower_bound":11000,"upper_bound":13500}]}

Generate exactly 30 forecast points starting from tomorrow ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}.`;

  const { text } = await callAI(systemPrompt, userMessage);
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in response');
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { metric = 'total_enrolments', state, horizon_days = 30 } = body;

    // 1. Try Python ML server
    try {
      const response = await fetch(`${ML_API_URL}/api/forecast/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, state, horizon_days }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          forecast: data,
          modelVersion: data.model_version || 'ml-1.0',
          source: 'ml-server',
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // ML server offline — fall through
    }

    // 2. AI fallback with real CSV data
    const store = getDataStore();
    await store.waitForData(10000);
    const overview = store.getNationalOverview();
    const states = store.getStateAggregations();

    if (!overview || states.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Data not yet loaded. Please try again in a few seconds.',
        forecast: null,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    let dataSummary = `National totals: enrolments=${overview.totalEnrolments.toLocaleString()}, biometric=${overview.totalBiometricUpdates.toLocaleString()}, demographic=${overview.totalDemographicUpdates.toLocaleString()}, coverage=${overview.nationalCoverage.toFixed(1)}%, freshness=${overview.freshnessIndex.toFixed(1)}%\n`;

    if (state) {
      const sd = store.getStateByCode(state);
      if (sd) {
        dataSummary += `${sd.stateName}: enrolments=${sd.totalEnrolments.toLocaleString()}, coverage=${sd.coverage.toFixed(1)}%, freshness=${sd.freshness.toFixed(1)}%, risk=${sd.riskLevel}`;
      }
    } else {
      dataSummary += states
        .slice(0, 5)
        .map(s => `${s.stateName}: ${s.totalEnrolments.toLocaleString()} enrolments, ${s.coverage.toFixed(1)}% coverage`)
        .join('\n');
    }

    const forecast = await aiForecast(metric, state || null, dataSummary);

    return NextResponse.json({
      success: true,
      forecast,
      source: 'ai-fallback',
      note: 'Python ML server offline — AI forecast on real CSV data',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Forecast API] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error), forecast: null, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function GET() {
  let mlOnline = false;
  try {
    const r = await fetch(`${ML_API_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    mlOnline = r.ok;
  } catch { /* offline */ }
  return NextResponse.json({
    status: mlOnline ? 'ml-server' : 'ai-fallback',
    mlServerOnline: mlOnline,
    fallbackChain: ['NVIDIA kimi-k2.6', 'NVIDIA glm4.7', 'Gemini'],
    timestamp: new Date().toISOString(),
  });
}
