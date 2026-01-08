'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Credentials are now handled server-side via /api/auth
// NO hardcoded passwords in client code

interface User {
  username: string
  email: string
  role: 'admin' | 'viewer'
  loginTime: Date
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Validate session with server
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'validate' })
        });
        
        const data = await response.json();
        
        if (data.valid && data.user) {
          setUser({
            ...data.user,
            loginTime: new Date()
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        const newUser: User = {
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          loginTime: new Date(data.user.loginTime)
        };
        
        setUser(newUser);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: data.error || 'Invalid credentials. Please check your username and password.' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to authentication service.' 
      };
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
