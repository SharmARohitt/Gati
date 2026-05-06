// System Status API - Check if data is loaded
// GET /api/status

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = getDataStore();
  const status = store.getLoadingStatus();
  const counts = store.getDataCounts();

  return NextResponse.json({
    dataLoaded: status.loaded,
    dataLoading: status.loading,
    error: status.error,
    counts,
    timestamp: new Date().toISOString(),
  });
}
