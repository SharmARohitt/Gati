/**
 * Unit tests for GATI Security Library
 * Tests all security utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock crypto for Node.js environment
const mockRandomValues = vi.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
})

vi.stubGlobal('crypto', {
  getRandomValues: mockRandomValues,
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
})

describe('Security Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CSRF Token Generation', () => {
    it('should generate tokens of correct length', async () => {
      const { Security } = await import('@/lib/security')
      const token = Security.csrf.generate()
      
      // Token should be a hex string (32 bytes = 64 hex chars)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens', async () => {
      const { Security } = await import('@/lib/security')
      const token1 = Security.csrf.generate()
      const token2 = Security.csrf.generate()
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('Rate Limiter', () => {
    it('should allow requests within limit', async () => {
      const { Security } = await import('@/lib/security')
      const identifier = 'test-user-1'
      
      // First request should be allowed
      const result = Security.checkRateLimit(identifier, 10, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should block requests over limit', async () => {
      const { Security } = await import('@/lib/security')
      const identifier = 'test-user-block'
      
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        Security.checkRateLimit(identifier, 5, 60000)
      }
      
      // Next request should be blocked
      const result = Security.checkRateLimit(identifier, 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('Input Sanitization', () => {
    it('should remove XSS attempts', async () => {
      const { sanitizeInput } = await import('@/lib/security')
      
      const malicious = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeInput(malicious)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
      expect(sanitized).toContain('Hello')
    })

    it('should handle empty strings', async () => {
      const { sanitizeInput } = await import('@/lib/security')
      
      const result = sanitizeInput('')
      expect(result).toBe('')
    })

    it('should trim whitespace', async () => {
      const { sanitizeInput } = await import('@/lib/security')
      
      const result = sanitizeInput('  hello world  ')
      expect(result).toBe('hello world')
    })
  })

  describe('Audit Logging', () => {
    it('should log events correctly', async () => {
      const { logAuditEvent, getAuditLogs } = await import('@/lib/security')
      
      logAuditEvent({
        action: 'login_attempt',
        userId: 'admin',
        ip: '127.0.0.1',
        success: true,
        riskLevel: 'low',
        details: { test: true },
      })
      
      const logs = getAuditLogs({ action: 'login_attempt', limit: 1 })
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].action).toBe('login_attempt')
      expect(logs[0].userId).toBe('admin')
    })
  })
})
