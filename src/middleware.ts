/**
 * GATI Security Middleware
 * Applies security headers and validations to all requests
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers to apply to all responses
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Rate limiting for different endpoints
const rateLimits = new Map<string, Map<string, { count: number; resetTime: number }>>();

function getRateLimit(path: string): { limit: number; window: number } {
  if (path.startsWith('/api/auth')) {
    return { limit: 10, window: 60000 }; // 10 requests per minute for auth
  }
  if (path.startsWith('/api/ai')) {
    return { limit: 30, window: 60000 }; // 30 requests per minute for AI
  }
  return { limit: 100, window: 60000 }; // 100 requests per minute for other APIs
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
  const { limit, window } = getRateLimit(path);
  const now = Date.now();
  
  if (!rateLimits.has(path)) {
    rateLimits.set(path, new Map());
  }
  
  const pathLimits = rateLimits.get(path)!;
  const record = pathLimits.get(ip);
  
  if (!record || now > record.resetTime) {
    pathLimits.set(ip, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // file extensions
  ) {
    return NextResponse.next();
  }
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api')) {
    const { allowed, remaining } = checkRateLimit(ip, pathname);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter: 60 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
  }
  
  // Protected routes check
  const protectedPaths = ['/admin', '/analytics', '/intelligence', '/audit'];
  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));
  
  if (isProtectedPath) {
    const sessionCookie = request.cookies.get('gati_session');
    
    if (!sessionCookie) {
      // Redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://router.huggingface.co https://api.mapbox.com http://localhost:8000",
    "frame-ancestors 'none'"
  ].join('; '));
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
