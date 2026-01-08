'use client';

/**
 * GATI Auth Provider Wrapper
 * Wraps the application with Supabase authentication context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseAuth, getSupabaseClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Normalized user type for the app
interface AppUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  fullName: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to normalize Supabase user to app user
function normalizeUser(supabaseUser: SupabaseUser | null): AppUser | null {
  if (!supabaseUser) return null;
  
  const email = supabaseUser.email || '';
  const metadata = supabaseUser.user_metadata || {};
  
  return {
    id: supabaseUser.id,
    username: metadata.full_name || email.split('@')[0] || 'User',
    email: email,
    role: metadata.role || 'user',
    fullName: metadata.full_name || email.split('@')[0] || 'User',
    avatarUrl: metadata.avatar_url,
  };
}

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state and listen for changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabaseAuth.signIn(email, password);
      
      if (error) {
        return { 
          success: false, 
          error: error.message || 'Invalid credentials' 
        };
      }
      
      if (data?.user) {
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Authentication failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to authentication service' 
      };
    }
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setSupabaseUser(null);
    setSession(null);
  };

  const user = normalizeUser(supabaseUser);

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProviderWrapper');
  }
  return context;
}
