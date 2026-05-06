/**
 * Unit tests for GATI Firebase Auth
 * Basic smoke tests for auth context
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

// Mock Firebase auth to avoid real network calls in tests
vi.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((cb: (user: null) => void) => {
      cb(null)
      return () => {}
    }),
  },
  app: {},
}))

vi.mock('@/lib/firebase/authHelpers', () => ({
  firebaseAuth: {
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    onAuthStateChanged: vi.fn((cb: (user: null) => void) => {
      cb(null)
      return () => {}
    }),
  },
}))

import { AuthProviderWrapper, useAuth } from '@/components/auth/AuthProviderWrapper'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProviderWrapper>{children}</AuthProviderWrapper>
}

describe('Firebase Auth Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should start unauthenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('Login Flow', () => {
    it('should handle failed login gracefully', async () => {
      const { firebaseAuth } = await import('@/lib/firebase/authHelpers')
      vi.mocked(firebaseAuth.signIn).mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid credentials'),
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'wrongpass')
      })

      expect(loginResult!.success).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
