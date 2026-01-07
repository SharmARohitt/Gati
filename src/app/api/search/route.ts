// Search API - Search by pincode
// GET /api/search?pincode=123456

import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const store = getDataStore();
    await store.loadAllData();
    
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const query = searchParams.get('q');
    
    if (pincode) {
      // Search by pincode
      const result = store.searchByPincode(pincode);
      
      if (!result) {
        return NextResponse.json(
          { error: `No data found for pincode: ${pincode}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        type: 'pincode',
        data: result,
      });
    }

    if (query) {
      // Search states/districts by name
      const states = store.getStateAggregations();
      const matchingStates = states.filter(s => 
        s.stateName.toLowerCase().includes(query.toLowerCase()) ||
        s.stateCode.toLowerCase().includes(query.toLowerCase())
      );

      return NextResponse.json({
        success: true,
        type: 'search',
        query,
        results: matchingStates.slice(0, 10),
        count: matchingStates.length,
      });
    }

    return NextResponse.json(
      { error: 'Please provide a search query (pincode or q parameter)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Error - /api/search:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}
