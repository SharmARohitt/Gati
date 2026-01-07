// ML Pattern Recognition API
// GET /api/ml/patterns?state=Maharashtra

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { detectPatterns, findCorrelations } from '@/lib/ml/patternRecognition';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get('state');
    
    if (!stateParam) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      );
    }
    
    const state = store.getStateByCode(stateParam);
    if (!state) {
      return NextResponse.json(
        { error: `State not found: ${stateParam}` },
        { status: 404 }
      );
    }
    
    // Detect patterns
    const patterns = detectPatterns(state);
    
    // Find correlations
    const correlations = findCorrelations(state);
    
    return NextResponse.json({
      success: true,
      data: {
        state: {
          code: state.stateCode,
          name: state.stateName,
        },
        patterns,
        correlations,
        summary: {
          totalPatterns: patterns.length,
          strongPatterns: patterns.filter(p => p.strength > 70).length,
          totalCorrelations: correlations.length,
          strongCorrelations: correlations.filter(c => c.strength === 'strong').length,
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/ml/patterns:', error);
    return NextResponse.json(
      { error: 'Pattern detection failed', details: String(error) },
      { status: 500 }
    );
  }
}

