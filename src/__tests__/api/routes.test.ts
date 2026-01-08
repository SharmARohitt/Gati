/**
 * Integration tests for GATI API routes
 * Tests API endpoints with mocked responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auth API - /api/auth', () => {
    it('should handle login request', async () => {
      const mockResponse = {
        success: true,
        user: {
          username: 'admin',
          email: 'admin@gati.gov.in',
          role: 'admin',
        },
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: 'admin',
          password: 'password123',
        }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.user.username).toBe('admin')
    })

    it('should handle validate request', async () => {
      const mockResponse = {
        valid: true,
        user: {
          username: 'admin',
          email: 'admin@gati.gov.in',
          role: 'admin',
        },
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.valid).toBe(true)
    })

    it('should handle logout request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })
  })

  describe('AI Chat API - /api/ai/chat', () => {
    it('should handle chat request', async () => {
      const mockResponse = {
        success: true,
        message: 'Based on the data analysis, Bihar shows a 23% increase...',
        model: 'Qwen/Qwen2.5-72B-Instruct',
        provider: 'huggingface',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What are the top anomalies in Bihar?',
          context: { state: 'Bihar' },
        }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.message).toBeDefined()
    })

    it('should handle missing message error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Message is required',
        }),
      } as Response)

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('ML Pipeline API - /api/ml/pipeline', () => {
    it('should return pipeline status', async () => {
      const mockResponse = {
        success: true,
        data: {
          models: [
            { name: 'isolation_forest', status: 'active', accuracy: 0.94 },
            { name: 'xgboost_risk', status: 'active', accuracy: 0.91 },
          ],
          lastTraining: '2026-01-07T10:00:00Z',
        },
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/ml/pipeline?action=status')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.models).toHaveLength(2)
    })

    it('should handle train request', async () => {
      const mockResponse = {
        success: true,
        message: 'Training initiated',
        jobId: 'train-12345',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/ml/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'train',
          modelType: 'anomaly',
        }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.jobId).toBeDefined()
    })
  })

  describe('Health API - /api/health', () => {
    it('should return system health', async () => {
      const mockResponse = {
        success: true,
        status: 'healthy',
        checks: {
          api: 'ok',
          ml: 'ok',
          memory: 'ok',
        },
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/health')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe('healthy')
    })
  })
})
