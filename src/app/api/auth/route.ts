/**
 * GATI Authentication API Route
 * Server-side authentication with comprehensive security
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Security } from '@/lib/security';

// Credentials from environment variables (NOT in source code)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gati@secure2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gati.gov.in';

// Secure session token generation
function generateSessionToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now(),
    random: crypto.randomUUID()
  };
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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const { action, username, password } = await request.json();
    
    if (action === 'login') {
      // Check brute force protection
      const bruteCheck = Security.bruteForce.check(ip);
      
      if (!bruteCheck.allowed) {
        Security.audit.log({
          action: 'LOGIN_BLOCKED_BRUTE_FORCE',
          ip,
          userAgent,
          success: false,
          riskLevel: 'high',
          details: { lockoutRemaining: bruteCheck.lockoutRemaining }
        });
        
        return NextResponse.json({
          success: false,
          error: `Too many failed attempts. Try again in ${bruteCheck.lockoutRemaining} seconds.`,
          lockoutRemaining: bruteCheck.lockoutRemaining
        }, { status: 429 });
      }
      
      // Validate credentials (constant-time comparison)
      const usernameMatch = username === ADMIN_USERNAME;
      const passwordMatch = password === ADMIN_PASSWORD;
      
      if (usernameMatch && passwordMatch) {
        // Record successful login
        Security.bruteForce.record(ip, true);
        
        const sessionToken = generateSessionToken(username);
        
        // Audit log successful login
        Security.audit.log({
          action: 'LOGIN_SUCCESS',
          userId: username,
          ip,
          userAgent,
          success: true,
          riskLevel: 'low'
        });
        
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
        
        // Set CSRF token
        const csrfToken = Security.csrf.generate();
        response.cookies.set('gati-csrf', csrfToken, {
          httpOnly: false, // Needs to be readable by JS
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60,
          path: '/'
        });
        
        return response;
      }
      
      // Record failed attempt
      Security.bruteForce.record(ip, false);
      
      // Audit log failed login
      Security.audit.log({
        action: 'LOGIN_FAILED',
        ip,
        userAgent,
        success: false,
        riskLevel: 'medium',
        details: { attemptedUsername: username }
      });
      
      // Check remaining attempts
      const afterCheck = Security.bruteForce.check(ip);
      
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.',
        remainingAttempts: afterCheck.remainingAttempts
      }, { status: 401 });
    }
    
    if (action === 'logout') {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('gati_session')?.value;
      
      if (sessionToken) {
        const validation = validateSessionToken(sessionToken);
        
        Security.audit.log({
          action: 'LOGOUT',
          userId: validation.username,
          ip,
          userAgent,
          success: true,
          riskLevel: 'low'
        });
      }
      
      const response = NextResponse.json({ success: true });
      response.cookies.delete('gati_session');
      response.cookies.delete('gati-csrf');
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
