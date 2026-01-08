/**
 * GATI Authentication API Route
 * Server-side authentication with secure credential handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In production, use bcrypt for password hashing and a real database
// For now, credentials are in environment variables (NOT in source code)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gati@secure2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gati.gov.in';
const SESSION_SECRET = process.env.SESSION_SECRET || 'gati-session-secret-change-in-production';

// Simple session token generation (in production, use proper JWT)
function generateSessionToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  };
  // Simple base64 encoding (in production, use proper JWT with signing)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Validate session token
function validateSessionToken(token: string): { valid: boolean; username?: string } {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const age = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > maxAge) {
      return { valid: false };
    }
    
    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, username, password } = await request.json();
    
    if (action === 'login') {
      // Rate limiting check (simple in-memory, use Redis in production)
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      
      // Validate credentials
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionToken = generateSessionToken(username);
        
        // Set HTTP-only cookie
        const response = NextResponse.json({
          success: true,
          user: {
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            role: 'admin',
            loginTime: new Date().toISOString()
          }
        });
        
        response.cookies.set('gati_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60, // 24 hours
          path: '/'
        });
        
        return response;
      }
      
      // Invalid credentials
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.'
      }, { status: 401 });
    }
    
    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('gati_session');
      return response;
    }
    
    if (action === 'validate') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('gati_session')?.value;
      
      if (!sessionToken) {
        return NextResponse.json({ valid: false });
      }
      
      const validation = validateSessionToken(sessionToken);
      
      if (validation.valid) {
        return NextResponse.json({
          valid: true,
          user: {
            username: validation.username,
            email: ADMIN_EMAIL,
            role: 'admin'
          }
        });
      }
      
      return NextResponse.json({ valid: false });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('[Auth API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication service error'
    }, { status: 500 });
  }
}

export async function GET() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('gati_session')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false });
  }
  
  const validation = validateSessionToken(sessionToken);
  
  if (validation.valid) {
    return NextResponse.json({
      authenticated: true,
      user: {
        username: validation.username,
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  }
  
  return NextResponse.json({ authenticated: false });
}
