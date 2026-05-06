/**
 * GATI Risk Scoring API
 * ML server → NVIDIA (kimi-k2.6 → glm4.7) → Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { callAI } from '@/lib/ai/providers';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

async function aiRiskAnalysis(dataSummary: string): Promise<any[]> {
  const systemPrompt = `You are an Aadhaar governance risk analyst. Assess risk levels for Indian states based on real data. Return ONLY a valid JSON array — no markdown, no explanation.`;

  const userMessage = `Assess risk for each state based on this real Aadhaar data:

${dataSummary}

Return a JSON array (no markdown):
[{"entity_id":"StateName","risk_level":"low|medium|high|critical","risk_score":0.75,"confidence":0.88,"top_factors":["specific factor from data","another factor"],"recommendations":["concrete action","another action"]}]`;

  const { text } = await callAI(systemPrompt, userMessage);
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response');
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Try Python ML server
    try {
      const response = await fetch(`${ML_API_URL}/api/risk/assess`, {
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
    const states = store.getStateAggregations().slice(0, 12);

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
        `${s.stateName}: coverage=${s.coverage.toFixed(1)}%, freshness=${s.freshness.toFixed(1)}%, currentRisk=${s.riskLevel}, enrolments=${s.totalEnrolments.toLocaleString()}, biometric=${s.totalBiometricUpdates.toLocaleString()}, demographic=${s.totalDemographicUpdates.toLocaleString()}`
      )
      .join('\n');

    const results = await aiRiskAnalysis(summary);

    return NextResponse.json({
      success: true,
      results,
      source: 'ai-fallback',
      note: 'Python ML server offline — AI risk analysis on real CSV data',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Risk API] Error:', error);
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
