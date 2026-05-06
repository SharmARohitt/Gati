/**
 * GATI Auth Callback
 * Firebase handles auth client-side; this just redirects to admin.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const next = new URL(request.url).searchParams.get('next') || '/admin';
  return NextResponse.redirect(new URL(next, request.url));
}
