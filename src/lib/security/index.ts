/**
 * GATI Security Middleware
 * Comprehensive security features for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// CSRF Protection
// ============================================
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'gati-csrf';

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  if (!cookieToken || !headerToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return result === 0;
}

// ============================================
// Brute Force Protection
// ============================================
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export function checkBruteForce(ip: string): { allowed: boolean; remainingAttempts: number; lockoutRemaining?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  // Check if locked out
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockoutRemaining: Math.ceil((attempt.lockedUntil - now) / 1000) 
    };
  }
  
  // Reset if window expired
  if (now - attempt.firstAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  return { 
    allowed: attempt.count < MAX_ATTEMPTS, 
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempt.count) 
  };
}

export function recordLoginAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  
  const attempt = loginAttempts.get(ip);
  
  if (!attempt || now - attempt.firstAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }
  
  attempt.count++;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION;
  }
}

// ============================================
// Security Headers
// ============================================
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://router.huggingface.co https://api.mapbox.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return response;
}

// ============================================
// Request Validation
// ============================================
export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // Allow same-origin requests
  if (!origin) return true;
  
  try {
    const originUrl = new URL(origin);
    const allowedHosts = [
      'localhost',
      'localhost:3000',
      host,
      process.env.ALLOWED_HOST
    ].filter(Boolean);
    
    return allowedHosts.some(allowed => 
      originUrl.host === allowed || originUrl.hostname === allowed
    );
  } catch {
    return false;
  }
}

// ============================================
// Input Sanitization
// ============================================
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .slice(0, 10000); // Limit length
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// ============================================
// Audit Logging
// ============================================
export interface AuditLog {
  timestamp: string;
  action: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const auditLogs: AuditLog[] = [];
const MAX_AUDIT_LOGS = 10000;

export function logAuditEvent(log: Omit<AuditLog, 'timestamp'>): void {
  const entry: AuditLog = {
    ...log,
    timestamp: new Date().toISOString()
  };
  
  auditLogs.unshift(entry);
  
  // Keep only recent logs (in production, persist to database)
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.pop();
  }
  
  // Console log for critical events
  if (log.riskLevel === 'critical' || log.riskLevel === 'high') {
    console.warn(`[SECURITY AUDIT] ${log.action}:`, entry);
  }
}

export function getAuditLogs(filters?: {
  action?: string;
  userId?: string;
  riskLevel?: string;
  limit?: number;
}): AuditLog[] {
  let filtered = [...auditLogs];
  
  if (filters?.action) {
    filtered = filtered.filter(l => l.action === filters.action);
  }
  if (filters?.userId) {
    filtered = filtered.filter(l => l.userId === filters.userId);
  }
  if (filters?.riskLevel) {
    filtered = filtered.filter(l => l.riskLevel === filters.riskLevel);
  }
  
  return filtered.slice(0, filters?.limit || 100);
}

// ============================================
// Session Management
// ============================================
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
  lastActivity: number;
}

const sessions = new Map<string, Session>();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes idle timeout

export function createSession(userId: string, ip: string, userAgent: string): Session {
  const sessionId = generateCSRFToken();
  const now = Date.now();
  
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
    ip,
    userAgent,
    lastActivity: now
  };
  
  sessions.set(sessionId, session);
  return session;
}

export function validateSession(sessionId: string, ip: string): Session | null {
  const session = sessions.get(sessionId);
  
  if (!session) return null;
  
  const now = Date.now();
  
  // Check expiration
  if (now > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  // Check idle timeout
  if (now - session.lastActivity > SESSION_IDLE_TIMEOUT) {
    sessions.delete(sessionId);
    return null;
  }
  
  // Validate IP hasn't changed (session hijacking protection)
  if (session.ip !== ip) {
    logAuditEvent({
      action: 'SESSION_IP_MISMATCH',
      userId: session.userId,
      ip,
      success: false,
      riskLevel: 'high',
      details: { originalIp: session.ip, newIp: ip }
    });
    sessions.delete(sessionId);
    return null;
  }
  
  // Update last activity
  session.lastActivity = now;
  
  return session;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function destroyAllUserSessions(userId: string): number {
  let count = 0;
  const entries = Array.from(sessions.entries());
  for (const [id, session] of entries) {
    if (session.userId === userId) {
      sessions.delete(id);
      count++;
    }
  }
  return count;
}

// ============================================
// API Key Validation
// ============================================
const API_KEYS = new Map<string, { name: string; permissions: string[]; rateLimit: number }>();

export function validateAPIKey(key: string): { valid: boolean; permissions?: string[] } {
  const keyData = API_KEYS.get(key);
  
  if (!keyData) {
    return { valid: false };
  }
  
  return { valid: true, permissions: keyData.permissions };
}

// ============================================
// Export all security utilities
// ============================================
export const Security = {
  // Backwards compatibility aliases
  generateCSRFToken,
  checkRateLimit: (id: string, max: number, window: number) => {
    const result = checkBruteForce(id);
    return { allowed: result.allowed, remaining: result.remainingAttempts };
  },
  // Structured API
  csrf: {
    generate: generateCSRFToken,
    validate: validateCSRFToken
  },
  bruteForce: {
    check: checkBruteForce,
    record: recordLoginAttempt
  },
  headers: addSecurityHeaders,
  origin: validateRequestOrigin,
  sanitize: {
    input: sanitizeInput,
    object: sanitizeObject
  },
  audit: {
    log: logAuditEvent,
    get: getAuditLogs
  },
  session: {
    create: createSession,
    validate: validateSession,
    destroy: destroySession,
    destroyAll: destroyAllUserSessions
  }
};

export default Security;
