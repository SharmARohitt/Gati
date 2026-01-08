/**
 * GATI Supabase Auth API Routes
 * Server-side authentication handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Security } from '@/lib/security';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const { action, ...data } = await request.json();
    const supabase = await createServerSupabaseClient();
    
    switch (action) {
      case 'get-session': {
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 });
        }
        
        return NextResponse.json({
          session: sessionData.session,
          user: sessionData.session?.user
        });
      }
      
      case 'get-user': {
        const { data: userData, error } = await supabase.auth.getUser();
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 });
        }
        
        return NextResponse.json({ user: userData.user });
      }
      
      case 'sign-in': {
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
            error: `Too many failed attempts. Try again in ${bruteCheck.lockoutRemaining} seconds.`,
            lockoutRemaining: bruteCheck.lockoutRemaining
          }, { status: 429 });
        }
        
        const { email, password } = data;
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          Security.bruteForce.record(ip, false);
          Security.audit.log({
            action: 'LOGIN_FAILED',
            ip,
            userAgent,
            success: false,
            riskLevel: 'medium',
            details: { attemptedEmail: email }
          });
          
          return NextResponse.json({ error: error.message }, { status: 401 });
        }
        
        Security.bruteForce.record(ip, true);
        Security.audit.log({
          action: 'LOGIN_SUCCESS',
          userId: signInData.user?.id,
          ip,
          userAgent,
          success: true,
          riskLevel: 'low'
        });
        
        return NextResponse.json({
          success: true,
          session: signInData.session,
          user: signInData.user
        });
      }
      
      case 'sign-up': {
        const { email, password, metadata } = data;
        
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: `${request.nextUrl.origin}/auth/callback`
          }
        });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        Security.audit.log({
          action: 'REGISTRATION',
          userId: signUpData.user?.id,
          ip,
          userAgent,
          success: true,
          riskLevel: 'low',
          details: { email }
        });
        
        return NextResponse.json({
          success: true,
          user: signUpData.user,
          message: signUpData.session 
            ? 'Account created successfully!' 
            : 'Please check your email to verify your account.'
        });
      }
      
      case 'sign-out': {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        Security.audit.log({
          action: 'LOGOUT',
          ip,
          userAgent,
          success: true,
          riskLevel: 'low'
        });
        
        return NextResponse.json({ success: true });
      }
      
      case 'reset-password': {
        const { email } = data;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${request.nextUrl.origin}/auth/reset-password`
        });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        Security.audit.log({
          action: 'PASSWORD_RESET_REQUESTED',
          ip,
          userAgent,
          success: true,
          riskLevel: 'medium',
          details: { email }
        });
        
        return NextResponse.json({ success: true });
      }
      
      case 'update-password': {
        const { password } = data;
        
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        Security.audit.log({
          action: 'PASSWORD_UPDATED',
          ip,
          userAgent,
          success: true,
          riskLevel: 'low'
        });
        
        return NextResponse.json({ success: true });
      }
      
      case 'update-profile': {
        const { metadata } = data;
        
        const { data: updateData, error } = await supabase.auth.updateUser({
          data: metadata
        });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        return NextResponse.json({
          success: true,
          user: updateData.user
        });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only endpoints
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const supabase = await createAdminClient();
    
    // Verify current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete user using admin client
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
