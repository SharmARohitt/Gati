/**
 * GATI Audit Log API
 * Security audit logging and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { Security } from '@/lib/security';
import { cookies } from 'next/headers';

// Validate admin session
async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('gati_session')?.value;
    
    if (!sessionToken) return false;
    
    const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    const age = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    
    return age <= maxAge && payload.username === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Require admin authentication
  const isAdmin = await validateAdminSession();
  
  if (!isAdmin) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized. Admin access required.'
    }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  
  const filters = {
    action: searchParams.get('action') || undefined,
    userId: searchParams.get('userId') || undefined,
    riskLevel: searchParams.get('riskLevel') || undefined,
    limit: parseInt(searchParams.get('limit') || '100')
  };
  
  const logs = Security.audit.get(filters);
  
  // Calculate summary statistics
  const summary = {
    total: logs.length,
    byRiskLevel: {
      critical: logs.filter(l => l.riskLevel === 'critical').length,
      high: logs.filter(l => l.riskLevel === 'high').length,
      medium: logs.filter(l => l.riskLevel === 'medium').length,
      low: logs.filter(l => l.riskLevel === 'low').length
    },
    bySuccess: {
      successful: logs.filter(l => l.success).length,
      failed: logs.filter(l => !l.success).length
    },
    recentActions: Array.from(new Set(logs.slice(0, 20).map(l => l.action)))
  };
  
  return NextResponse.json({
    success: true,
    data: {
      logs,
      summary,
      filters,
      timestamp: new Date().toISOString()
    }
  });
}

export async function POST(request: NextRequest) {
  // Allow internal logging from other API routes
  const internalKey = request.headers.get('x-internal-key');
  const isInternal = internalKey === process.env.SESSION_SECRET;
  
  if (!isInternal) {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
  }
  
  try {
    const body = await request.json();
    const { action, details, riskLevel } = body;
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    Security.audit.log({
      action: action || 'MANUAL_LOG',
      ip,
      userAgent,
      success: true,
      riskLevel: riskLevel || 'low',
      details
    });
    
    return NextResponse.json({
      success: true,
      message: 'Audit event logged'
    });
  } catch (error) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to log audit event'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Admin-only: Clear old audit logs
  const isAdmin = await validateAdminSession();
  
  if (!isAdmin) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized. Admin access required.'
    }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get('olderThan') || '30');
  
  // In a real implementation, this would delete from database
  // For now, we just log the action
  
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  Security.audit.log({
    action: 'AUDIT_LOGS_PURGE_REQUESTED',
    userId: 'admin',
    ip,
    success: true,
    riskLevel: 'medium',
    details: { olderThanDays }
  });
  
  return NextResponse.json({
    success: true,
    message: `Audit log purge scheduled for entries older than ${olderThanDays} days`
  });
}
