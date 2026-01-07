// States API - Get all state aggregations
// GET /api/states

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'enrolments';
    const limit = parseInt(searchParams.get('limit') || '0');
    const riskFilter = searchParams.get('risk');

    let states = store.getStateAggregations();
    const overview = store.getNationalOverview();

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
      case 'risk':
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        states = [...states].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        break;
      case 'name':
        states = [...states].sort((a, b) => a.stateName.localeCompare(b.stateName));
        break;
      default:
        // Already sorted by enrolments in aggregator
        break;
    }

    // Limit results if specified
    if (limit > 0) {
      states = states.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      count: states.length,
      data: {
        overview,
        states,
      },
    });
  } catch (error) {
    console.error('API Error - /api/states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states data', details: String(error) },
      { status: 500 }
    );
  }
}
