/**
 * GATI AI Chat API
 * Provider chain: NVIDIA kimi-k2.6 → NVIDIA glm4.7 → Gemini
 * Each provider retries 2× with exponential back-off before falling through.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAI, getProviderStatus } from '@/lib/ai/providers';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 });
    return { allowed: true, remaining: 29 };
  }
  if (record.count >= 30) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: 30 - record.count };
}

// ─── Context builder ──────────────────────────────────────────────────────────

async function buildContext(): Promise<string> {
  let ctx = '';

  // ML server status
  try {
    const res = await fetch(`${ML_API_URL}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const h = await res.json();
      const models = Object.entries(h.models_loaded || {})
        .map(([k, v]) => `${k}=${v ? 'ready' : 'loading'}`)
        .join(', ');
      ctx += `ML API: Online${models ? ` (${models})` : ''}\n`;
    } else {
      ctx += 'ML API: Offline\n';
    }
  } catch {
    ctx += 'ML API: Offline\n';
  }

  // Real CSV data summary
  try {
    const { getDataStore } = await import('@/lib/data/server');
    const store = getDataStore();
    await store.waitForData(5000); // don't block chat for too long
    const overview = store.getNationalOverview();
    const states = store.getStateAggregations();

    if (overview && overview.statesCount > 0) {
      ctx += `\nLive Aadhaar Data:\n`;
      ctx += `- Enrolments: ${overview.totalEnrolments.toLocaleString()}\n`;
      ctx += `- Biometric Updates: ${overview.totalBiometricUpdates.toLocaleString()}\n`;
      ctx += `- Demographic Updates: ${overview.totalDemographicUpdates.toLocaleString()}\n`;
      ctx += `- Coverage: ${overview.nationalCoverage.toFixed(1)}%\n`;
      ctx += `- Freshness: ${overview.freshnessIndex.toFixed(1)}%\n`;
      ctx += `- States: ${overview.statesCount}\n`;
      ctx += `- Risk: Critical=${overview.riskDistribution.critical} High=${overview.riskDistribution.high} Medium=${overview.riskDistribution.medium} Low=${overview.riskDistribution.low}\n`;

      const highRisk = states
        .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
        .slice(0, 5)
        .map(s => `${s.stateName}(${s.riskLevel})`);
      if (highRisk.length) ctx += `- High/Critical States: ${highRisk.join(', ')}\n`;

      const top = states.slice(0, 5).map(s => `${s.stateName}(${s.totalEnrolments.toLocaleString()})`);
      ctx += `- Top States by Enrolment: ${top.join(', ')}\n`;
    }
  } catch {
    ctx += 'CSV data: unavailable\n';
  }

  return ctx;
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(context: string): string {
  return `You are GATI AI — the intelligent assistant for India's Governance & Aadhaar Tracking Intelligence platform.

Your role:
- Analyze Aadhaar enrollment, biometric, and demographic data patterns across India
- Identify anomalies, coverage gaps, and risk signals at state/district level
- Provide actionable governance insights for UIDAI officials
- Explain trends, forecasts, and recommendations clearly

Rules:
1. Be concise and professional — responses for senior government officials
2. Use exact numbers from the context when available
3. Never fabricate statistics — say "data unavailable" if needed
4. Recommend concrete, actionable next steps
5. Keep answers focused and under 300 words unless asked for detail

Current System Context:
${context || 'System context loading...'}`;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, response: 'Rate limit exceeded. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { message, includeContext = true } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ success: false, error: 'Message too long (max 5000 chars)' }, { status: 400 });
    }

    const sanitized = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();

    const context = includeContext ? await buildContext() : '';
    const systemPrompt = buildSystemPrompt(context);

    const { text, provider, model } = await callAI(systemPrompt, sanitized);

    return NextResponse.json(
      {
        success: true,
        response: text,
        provider,
        modelUsed: model,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  } catch (error) {
    console.error('[AI Chat] All providers failed:', error);

    const msg = error instanceof Error ? error.message : String(error);
    let userFacing = 'I encountered an error processing your request. ';
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      userFacing += 'The AI service timed out — please try a shorter question.';
    } else if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      userFacing += 'The AI service is at capacity. Please try again in a moment.';
    } else if (msg.includes('not configured')) {
      userFacing += 'AI service is not configured. Please check the API keys in .env.local.';
    } else {
      userFacing += 'Please try again shortly.';
    }

    return NextResponse.json(
      { success: false, response: userFacing, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getProviderStatus();
  return NextResponse.json({
    status: 'ok',
    primary: status.primary,
    providers: {
      nvidia: status.nvidia ? 'configured' : 'not configured',
      gemini: status.gemini ? 'configured' : 'not configured',
    },
    fallbackChain: ['NVIDIA kimi-k2.6', 'NVIDIA glm4.7', 'Gemini'],
    timestamp: new Date().toISOString(),
  });
}
