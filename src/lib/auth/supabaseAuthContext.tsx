'use client';

/**
 * GATI Auth Context with Supabase
 * Manages authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabaseAuth, getSupabaseClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// User type for the application
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'officer' | 'analyst' | 'viewer';
  department?: string;
  avatarUrl?: string;
  loginTime: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, metadata?: { full_name?: string; role?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Transform Supabase user to app User
function transformUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    role: supabaseUser.user_metadata?.role || 'viewer',
    department: supabaseUser.user_metadata?.department,
    avatarUrl: supabaseUser.user_metadata?.avatar_url,
    loginTime: new Date()
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(transformUser(initialSession.user));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(transformUser(session.user));
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email/password
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabaseAuth.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.session) {
        return { success: true };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  // Login with magic link
  const loginWithMagicLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseAuth.signInWithOtp(email);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  // Register new user
  const register = useCallback(async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabaseAuth.signUp(email, password, metadata);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabaseAuth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseAuth.resetPassword(email);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseAuth.updatePassword(password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: { full_name?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabaseAuth.updateProfile(data);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Refresh user data
      const { data: userData } = await supabaseAuth.getUser();
      if (userData.user) {
        setUser(transformUser(userData.user));
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithMagicLink,
      register,
      logout,
      resetPassword,
      updatePassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = `${redirectTo}?returnUrl=${encodeURIComponent(window.location.pathname)}`;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Hook for role-based access
export function useRequireRole(allowedRoles: string[], redirectTo = '/unauthorized') {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      window.location.href = redirectTo;
    }
  }, [user, isLoading, allowedRoles, redirectTo]);

  return { user, isLoading, hasAccess: user ? allowedRoles.includes(user.role) : false };
}
