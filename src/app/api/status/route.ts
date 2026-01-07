// Data Status API - Check data loading status
// GET /api/status

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = getDataStore();
    const status = store.getLoadingStatus();
    
    let dataCounts = { biometric: 0, demographic: 0, enrolment: 0, total: 0 };
    let statesCount = 0;
    
    if (status.loaded) {
      dataCounts = store.getDataCounts();
      statesCount = store.getStateAggregations().length;
    }

    return NextResponse.json({
      success: true,
      status: {
        loaded: status.loaded,
        loading: status.loading,
        ready: status.loaded && !status.loading,
      },
      dataCounts,
      statesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - /api/status:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: String(error) },
      { status: 500 }
    );
  }
}

// POST to trigger data loading
export async function POST() {
  try {
    const store = getDataStore();
    
    // Don't wait for loading, return immediately
    store.loadAllData().catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Data loading initiated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error - POST /api/status:', error);
    return NextResponse.json(
      { error: 'Failed to initiate loading', details: String(error) },
      { status: 500 }
    );
  }
}
