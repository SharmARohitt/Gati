// Trends API - Get time-series data
// GET /api/analytics/trends

import { NextResponse } from 'next/server';
import { getDataStore, calculateGrowthRates } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const days = parseInt(searchParams.get('days') || '30');
    
    let trends;
    
    if (state) {
      // Get trends for specific state
      const stateData = store.getStateByCode(state);
      if (!stateData) {
        return NextResponse.json(
          { error: `State not found: ${state}` },
          { status: 404 }
        );
      }
      trends = store.getStateTrends(stateData.stateName, days);
    } else {
      // Get national trends
      const overview = store.getNationalOverview();
      trends = overview?.recentTrends.slice(-days) || [];
    }

    // Calculate growth rates
    const growth = calculateGrowthRates(trends);

    // Calculate summary statistics
    const totalEnrolments = trends.reduce((sum, t) => sum + t.enrolments, 0);
    const totalBiometric = trends.reduce((sum, t) => sum + t.biometricUpdates, 0);
    const totalDemographic = trends.reduce((sum, t) => sum + t.demographicUpdates, 0);
    
    const avgDaily = {
      enrolments: Math.round(totalEnrolments / Math.max(1, trends.length)),
      biometric: Math.round(totalBiometric / Math.max(1, trends.length)),
      demographic: Math.round(totalDemographic / Math.max(1, trends.length)),
    };

    return NextResponse.json({
      success: true,
      data: {
        period: `${days} days`,
        startDate: trends[0]?.date || null,
        endDate: trends[trends.length - 1]?.date || null,
        trends,
        growth,
        totals: {
          enrolments: totalEnrolments,
          biometric: totalBiometric,
          demographic: totalDemographic,
        },
        averageDaily: avgDaily,
      },
      state: state || 'National',
    });
  } catch (error) {
    console.error('API Error - /api/analytics/trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: String(error) },
      { status: 500 }
    );
  }
}
