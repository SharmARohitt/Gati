'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Admin credentials (in production, this would be in a secure database)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'gati@2024',
  email: 'admin@gati.gov.in'
}

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
    const checkSession = () => {
      try {
        const storedSession = localStorage.getItem('gati_admin_session')
        if (storedSession) {
          const session = JSON.parse(storedSession)
          // Check if session is still valid (24 hours)
          const loginTime = new Date(session.loginTime)
          const now = new Date()
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24) {
            setUser({
              ...session,
              loginTime: new Date(session.loginTime)
            })
          } else {
            // Session expired
            localStorage.removeItem('gati_admin_session')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('gati_admin_session')
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const newUser: User = {
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        role: 'admin',
        loginTime: new Date()
      }
      
      setUser(newUser)
      localStorage.setItem('gati_admin_session', JSON.stringify(newUser))
      
      return { success: true }
    }

    return { 
      success: false, 
      error: 'Invalid credentials. Please check your username and password.' 
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gati_admin_session')
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
