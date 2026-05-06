/**
 * GATI Anomaly Detection API
 * ML server → NVIDIA (kimi-k2.6 → glm4.7) → Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { callAI } from '@/lib/ai/providers';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

async function aiAnomalyAnalysis(statesSummary: string): Promise<any[]> {
  const systemPrompt = `You are an Aadhaar data anomaly detection expert. Analyze the provided state-level data and identify the top anomalies. Return ONLY a valid JSON array — no markdown, no explanation, no code fences.`;

  const userMessage = `Analyze this real Aadhaar state data and return the top 5 anomalies as a JSON array:

${statesSummary}

Required JSON format:
[{"entity_id":"StateName","is_anomaly":true,"anomaly_score":0.85,"severity":"high|medium|low|critical","explanation":"specific reason based on the data","detected_at":"${new Date().toISOString()}"}]`;

  const { text } = await callAI(systemPrompt, userMessage);
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Extract JSON array from response
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response');
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Try Python ML server
    try {
      const response = await fetch(`${ML_API_URL}/api/anomaly/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          results: data.results || data,
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
    const states = store.getStateAggregations().slice(0, 15);

    if (states.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Data not yet loaded. Please try again in a few seconds.',
        results: [],
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    const summary = states
      .map(s =>
        `${s.stateName}: coverage=${s.coverage.toFixed(1)}%, freshness=${s.freshness.toFixed(1)}%, risk=${s.riskLevel}, enrolments=${s.totalEnrolments.toLocaleString()}, biometric=${s.totalBiometricUpdates.toLocaleString()}`
      )
      .join('\n');

    const results = await aiAnomalyAnalysis(summary);

    return NextResponse.json({
      success: true,
      results,
      source: 'ai-fallback',
      note: 'Python ML server offline — AI analysis on real CSV data',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Anomaly API] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error), results: [], timestamp: new Date().toISOString() },
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
