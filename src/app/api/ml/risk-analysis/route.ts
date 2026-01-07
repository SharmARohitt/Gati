// ML Risk Analysis API
// GET /api/ml/risk-analysis?state=Maharashtra

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { calculateAdvancedRiskScore, compareRiskScores } from '@/lib/ml/riskScoring';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get('state');
    const compare = searchParams.get('compare') === 'true';
    
    const overview = store.getNationalOverview();
    if (!overview) {
      return NextResponse.json(
        { error: 'Data not loaded' },
        { status: 503 }
      );
    }
    
    const nationalAverage = {
      coverage: overview.nationalCoverage,
      freshness: overview.freshnessIndex,
      avgEnrolments: overview.totalEnrolments / Math.max(1, overview.statesCount),
    };
    
    if (stateParam) {
      // Single state risk analysis
      const state = store.getStateByCode(stateParam);
      if (!state) {
        return NextResponse.json(
          { error: `State not found: ${stateParam}` },
          { status: 404 }
        );
      }
      
      const riskScore = calculateAdvancedRiskScore(state, nationalAverage);
      
      return NextResponse.json({
        success: true,
        data: {
          state: {
            code: state.stateCode,
            name: state.stateName,
          },
          riskScore,
          context: {
            nationalAverage,
            stateMetrics: {
              coverage: state.coverage,
              freshness: state.freshness,
              totalEnrolments: state.totalEnrolments,
            },
          },
        },
        generatedAt: new Date().toISOString(),
      });
    } else if (compare) {
      // Compare all states
      const allStates = store.getStateAggregations();
      const comparison = compareRiskScores(allStates, nationalAverage);
      
      return NextResponse.json({
        success: true,
        data: {
          comparison,
          nationalAverage,
          totalStates: allStates.length,
        },
        generatedAt: new Date().toISOString(),
      });
    } else {
      // Risk analysis for all states
      const allStates = store.getStateAggregations();
      const riskScores = allStates.map(state => ({
        state: {
          code: state.stateCode,
          name: state.stateName,
        },
        riskScore: calculateAdvancedRiskScore(state, nationalAverage),
      }));
      
      // Sort by risk
      riskScores.sort((a, b) => b.riskScore.overall - a.riskScore.overall);
      
      return NextResponse.json({
        success: true,
        data: {
          riskScores,
          summary: {
            critical: riskScores.filter(r => r.riskScore.level === 'critical').length,
            high: riskScores.filter(r => r.riskScore.level === 'high').length,
            medium: riskScores.filter(r => r.riskScore.level === 'medium').length,
            low: riskScores.filter(r => r.riskScore.level === 'low').length,
          },
          nationalAverage,
        },
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('API Error - /api/ml/risk-analysis:', error);
    return NextResponse.json(
      { error: 'Risk analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}

