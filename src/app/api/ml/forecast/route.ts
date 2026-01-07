// ML Forecasting API
// GET /api/ml/forecast?state=Maharashtra&metric=enrolments&periods=30

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { ensembleForecast, detectSeasonality } from '@/lib/ml/forecasting';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get('state');
    const metric = (searchParams.get('metric') || 'enrolments') as 'enrolments' | 'biometricUpdates' | 'demographicUpdates';
    const periods = parseInt(searchParams.get('periods') || '30');
    
    if (periods > 180) {
      return NextResponse.json(
        { error: 'Maximum forecast period is 180 days' },
        { status: 400 }
      );
    }
    
    let trends;
    
    if (stateParam) {
      // Get trends for specific state
      const state = store.getStateByCode(stateParam);
      if (!state) {
        return NextResponse.json(
          { error: `State not found: ${stateParam}` },
          { status: 404 }
        );
      }
      trends = store.getStateTrends(state.stateName, 90); // Use 90 days for better forecasting
    } else {
      // Get national trends
      const overview = store.getNationalOverview();
      trends = overview?.recentTrends.slice(-90) || [];
    }
    
    if (trends.length < 7) {
      return NextResponse.json(
        { error: 'Insufficient data for forecasting. Need at least 7 days of data.' },
        { status: 400 }
      );
    }
    
    // Generate ensemble forecast
    const forecast = ensembleForecast(trends, metric, periods);
    
    // Detect seasonality
    const seasonality = detectSeasonality(trends, metric);
    
    return NextResponse.json({
      success: true,
      data: {
        forecast: forecast.forecast,
        model: {
          name: forecast.name,
          accuracy: forecast.accuracy,
          rmse: forecast.rmse,
          mape: forecast.mape,
        },
        seasonality,
        metadata: {
          state: stateParam || 'National',
          metric,
          periods,
          historicalDataPoints: trends.length,
          forecastStartDate: forecast.forecast[0]?.date,
          forecastEndDate: forecast.forecast[forecast.forecast.length - 1]?.date,
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/ml/forecast:', error);
    return NextResponse.json(
      { error: 'Forecast generation failed', details: String(error) },
      { status: 500 }
    );
  }
}

