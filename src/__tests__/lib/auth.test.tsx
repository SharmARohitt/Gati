/**
 * Unit tests for GATI Auth Context
 * Tests authentication flow and session management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth/authContext'
import { ReactNode } from 'react'

// Wrapper component for hooks
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('Auth Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should start with loading state', () => {
      // Mock the validate session call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should complete loading after session check', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock validate session call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock successful login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: {
            username: 'admin',
            email: 'admin@gati.gov.in',
            role: 'admin',
            loginTime: new Date().toISOString(),
          },
        }),
      } as Response)

      // Perform login
      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('admin', 'password123')
      })

      expect(loginResult!.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user?.username).toBe('admin')
    })

    it('should fail login with invalid credentials', async () => {
      // Mock validate session call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock failed login
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials',
        }),
      } as Response)

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('admin', 'wrongpassword')
      })

      expect(loginResult!.success).toBe(false)
      expect(loginResult!.error).toBe('Invalid credentials')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      // Mock validate session call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock network error
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('admin', 'password')
      })

      expect(loginResult!.success).toBe(false)
      expect(loginResult!.error).toContain('Unable to connect')
    })
  })

  describe('Logout Flow', () => {
    it('should clear user on logout', async () => {
      // Mock validate session with existing session
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          user: {
            username: 'admin',
            email: 'admin@gati.gov.in',
            role: 'admin',
          },
        }),
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Mock logout call
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)

      await act(async () => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
