'use client'

import { AuthProvider } from '@/lib/auth/authContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AuthProvider>
  )
}
