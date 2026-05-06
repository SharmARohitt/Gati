// States API - Get all state aggregations
// GET /api/states

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();

    // Trigger background load if not started yet
    store.startBackgroundLoad();

    // Wait up to 90s for data to load (CSV files are large)
    await store.waitForData(90000);

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'enrolments';
    const limit = parseInt(searchParams.get('limit') || '0');
    const riskFilter = searchParams.get('risk');

    let states = store.getStateAggregations();
    const overview = store.getNationalOverview();
    const status = store.getLoadingStatus();

    // If still loading, return what we have with a loading flag
    if (!status.loaded && status.loading) {
      return NextResponse.json({
        success: true,
        loading: true,
        message: 'Data is still loading. Please retry in a few seconds.',
        count: states.length,
        data: {
          overview: overview || {
            totalEnrolments: 0,
            totalBiometricUpdates: 0,
            totalDemographicUpdates: 0,
            nationalCoverage: 0,
            freshnessIndex: 0,
            statesCount: 0,
            districtsCount: 0,
            pincodesCount: 0,
            ageBreakdown: { age0To5: 0, age5To17: 0, age18Plus: 0 },
            riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
            topPerformingStates: [],
            highRiskStates: [],
            recentTrends: [],
            lastUpdated: new Date().toISOString(),
          },
          states: [],
        },
      });
    }

    // Filter by risk level if specified
    if (riskFilter) {
      states = states.filter(s => s.riskLevel === riskFilter);
    }

    // Sort
    switch (sortBy) {
      case 'coverage':
        states = [...states].sort((a, b) => b.coverage - a.coverage);
        break;
      case 'freshness':
        states = [...states].sort((a, b) => b.freshness - a.freshness);
        break;
      case 'risk': {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        states = [...states].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        break;
      }
      case 'name':
        states = [...states].sort((a, b) => a.stateName.localeCompare(b.stateName));
        break;
      default:
        break;
    }

    if (limit > 0) {
      states = states.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      loading: false,
      count: states.length,
      data: { overview, states },
    });
  } catch (error) {
    console.error('API Error - /api/states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states data', details: String(error) },
      { status: 500 }
    );
  }
}
