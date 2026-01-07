// Analytics Comparison API
// GET /api/analytics/compare?states=Maharashtra,Bihar&metric=coverage

import { NextResponse } from 'next/server';
import { getDataStore, StateAggregation } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

interface ComparisonItem {
  stateCode: string;
  stateName: string;
  coverage?: number;
  freshness?: number;
  totalEnrolments?: number;
  totalBiometricUpdates?: number;
  totalDemographicUpdates?: number;
  districtsCount?: number;
  pincodesCount?: number;
  riskLevel?: string;
  ageDistribution?: { infants: number; children: number; adults: number };
}

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const statesParam = searchParams.get('states');
    const metric = searchParams.get('metric') || 'all';
    
    if (!statesParam) {
      return NextResponse.json(
        { error: 'States parameter is required (comma-separated)' },
        { status: 400 }
      );
    }
    
    const stateNames = statesParam.split(',').map(s => s.trim());
    const states = stateNames
      .map(name => store.getStateByCode(name))
      .filter((s): s is StateAggregation => s !== undefined);
    
    if (states.length === 0) {
      return NextResponse.json(
        { error: 'No valid states found' },
        { status: 404 }
      );
    }
    
    const comparison: ComparisonItem[] = states.map(state => {
      const base: ComparisonItem = {
        stateCode: state.stateCode,
        stateName: state.stateName,
      };
      
      if (metric === 'all' || metric === 'coverage') {
        return {
          ...base,
          coverage: state.coverage,
          freshness: state.freshness,
          totalEnrolments: state.totalEnrolments,
          totalBiometricUpdates: state.totalBiometricUpdates,
          totalDemographicUpdates: state.totalDemographicUpdates,
          districtsCount: state.districtsCount,
          pincodesCount: state.pincodesCount,
          riskLevel: state.riskLevel,
          ageDistribution: state.ageDistribution,
        };
      } else if (metric === 'freshness') {
        return { ...base, freshness: state.freshness };
      } else if (metric === 'enrolments') {
        return { ...base, totalEnrolments: state.totalEnrolments };
      }
      
      return base;
    });
    
    // Calculate differences
    const differences: Array<{
      state1: string;
      state2: string;
      coverageDiff: number;
      freshnessDiff: number;
      enrolmentsDiff: number;
    }> = [];
    if (comparison.length >= 2) {
      const first = comparison[0];
      for (let i = 1; i < comparison.length; i++) {
        const current = comparison[i];
        differences.push({
          state1: first.stateName,
          state2: current.stateName,
          coverageDiff: (current.coverage || 0) - (first.coverage || 0),
          freshnessDiff: (current.freshness || 0) - (first.freshness || 0),
          enrolmentsDiff: (current.totalEnrolments || 0) - (first.totalEnrolments || 0),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        comparison,
        differences,
        summary: {
          statesCount: comparison.length,
          avgCoverage: comparison.reduce((sum, s) => sum + (s.coverage || 0), 0) / comparison.length,
          avgFreshness: comparison.reduce((sum, s) => sum + (s.freshness || 0), 0) / comparison.length,
          totalEnrolments: comparison.reduce((sum, s) => sum + (s.totalEnrolments || 0), 0),
        },
      },
    });
  } catch (error) {
    console.error('API Error - /api/analytics/compare:', error);
    return NextResponse.json(
      { error: 'Comparison failed', details: String(error) },
      { status: 500 }
    );
  }
}

