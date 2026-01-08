/**
 * GATI Health Check API
 * Comprehensive system health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  details?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: HealthStatus[] = [];
  
  // Check 1: Frontend service (always healthy if we reach here)
  checks.push({
    service: 'frontend',
    status: 'healthy',
    latency: 0,
    details: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
  
  // Check 2: ML API
  try {
    const mlStart = Date.now();
    const mlResponse = await fetch(`${ML_API_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    const mlLatency = Date.now() - mlStart;
    
    if (mlResponse.ok) {
      const mlHealth = await mlResponse.json();
      checks.push({
        service: 'ml-api',
        status: 'healthy',
        latency: mlLatency,
        details: {
          models_loaded: mlHealth.models_loaded,
          version: mlHealth.version
        }
      });
    } else {
      checks.push({
        service: 'ml-api',
        status: 'degraded',
        latency: mlLatency,
        details: { error: 'Non-200 response' }
      });
    }
  } catch (error) {
    checks.push({
      service: 'ml-api',
      status: 'unhealthy',
      details: { error: 'Connection failed' }
    });
  }
  
  // Check 3: AI Service (Hugging Face)
  const hfConfigured = !!process.env.HUGGINGFACE_API_KEY;
  checks.push({
    service: 'ai-service',
    status: hfConfigured ? 'healthy' : 'degraded',
    details: {
      provider: 'Hugging Face',
      configured: hfConfigured
    }
  });
  
  // Check 4: Authentication
  const authConfigured = !!(
    process.env.ADMIN_USERNAME && 
    process.env.ADMIN_PASSWORD && 
    process.env.SESSION_SECRET
  );
  checks.push({
    service: 'authentication',
    status: authConfigured ? 'healthy' : 'unhealthy',
    details: {
      configured: authConfigured,
      sessionSecret: !!process.env.SESSION_SECRET
    }
  });
  
  // Aggregate status
  const overallStatus = checks.every(c => c.status === 'healthy') 
    ? 'healthy'
    : checks.some(c => c.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';
  
  const totalLatency = Date.now() - startTime;
  
  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    },
    latency: totalLatency
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
