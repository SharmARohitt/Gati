/**
 * GATI Security Middleware
 * Applies security headers and rate limiting.
 * Auth is handled client-side via Firebase — no server-side session check needed.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const rateLimits = new Map<string, Map<string, { count: number; resetTime: number }>>();

function getRateLimit(path: string): { limit: number; window: number } {
  if (path.startsWith('/api/auth')) return { limit: 10, window: 60000 };
  if (path.startsWith('/api/ai')) return { limit: 30, window: 60000 };
  return { limit: 100, window: 60000 };
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  const { limit, window } = getRateLimit(path);
  const now = Date.now();
  if (!rateLimits.has(path)) rateLimits.set(path, new Map());
  const pathLimits = rateLimits.get(path)!;
  const record = pathLimits.get(ip);
  if (!record || now > record.resetTime) {
    pathLimits.set(ip, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: limit - 1 };
  }
  if (record.count >= limit) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') || 'unknown';

  if (pathname.startsWith('/api')) {
    const { allowed } = checkRateLimit(ip, pathname);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }
  }

  const response = NextResponse.next();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://router.huggingface.co https://generativelanguage.googleapis.com https://api.mapbox.com http://localhost:8000",
    "frame-src https://*.firebaseapp.com",
    "frame-ancestors 'none'"
  ].join('; '));

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
