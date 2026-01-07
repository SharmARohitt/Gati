// National Analytics Overview API
// GET /api/analytics/overview

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';
import { dataCache, cacheKeys } from '@/lib/data/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check cache first
    const cacheKey = cacheKeys.nationalOverview();
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        meta: {
          cached: true,
          cachedAt: new Date().toISOString(),
        }
      });
    }
    
    const store = getDataStore();
    
    // Ensure data is loaded
    await store.loadAllData();
    
    const overview = store.getNationalOverview();
    
    if (!overview) {
      return NextResponse.json(
        { error: 'Data not yet loaded' },
        { status: 503 }
      );
    }

    // Cache the result (5 minutes TTL)
    dataCache.set(cacheKey, overview, 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: overview,
      meta: {
        dataCounts: store.getDataCounts(),
        loadedAt: new Date().toISOString(),
        cached: false,
      }
    });
  } catch (error) {
    console.error('API Error - /api/analytics/overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview', details: String(error) },
      { status: 500 }
    );
  }
}
