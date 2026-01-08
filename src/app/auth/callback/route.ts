/**
 * GATI Auth Callback Handler
 * Handles OAuth and magic link callbacks from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/admin';

  if (code) {
    const supabase = await createServerSupabaseClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to the intended destination
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
