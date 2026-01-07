// State Detail API - Get specific state with districts
// GET /api/states/[stateCode]

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { stateCode: string } }
) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { stateCode } = params;
    
    // Try to find state by code or name
    const state = store.getStateByCode(stateCode);
    
    if (!state) {
      return NextResponse.json(
        { error: `State not found: ${stateCode}` },
        { status: 404 }
      );
    }

    // Get districts for this state
    const districts = store.getDistrictsByState(state.stateName);
    
    // Get trends
    const trends = store.getStateTrends(state.stateName, 30);

    return NextResponse.json({
      success: true,
      data: {
        state,
        districts,
        trends,
        summary: {
          totalDistricts: districts.length,
          topDistrict: districts[0]?.districtName || 'N/A',
          totalPincodes: districts.reduce((sum, d) => sum + d.pincodesCount, 0),
        }
      },
    });
  } catch (error) {
    console.error(`API Error - /api/states/${params.stateCode}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch state details', details: String(error) },
      { status: 500 }
    );
  }
}
