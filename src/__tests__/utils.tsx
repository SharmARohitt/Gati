/**
 * Test utilities for GATI
 * Custom render function with providers and common test helpers
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth/authContext'

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface AllProvidersProps {
  children: ReactNode
}

/**
 * Wrapper with all providers for testing
 */
function AllProviders({ children }: AllProvidersProps) {
  const testQueryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render function that wraps component with all providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * Mock API response helper
 */
export function mockFetchResponse<T>(data: T, options: { status?: number; ok?: boolean } = {}) {
  const { status = 200, ok = true } = options
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as Response)
}

/**
 * Mock fetch error
 */
export function mockFetchError(message: string) {
  return Promise.reject(new Error(message))
}

/**
 * Create mock user for auth testing
 */
export function createMockUser(overrides = {}) {
  return {
    username: 'admin',
    email: 'admin@gati.gov.in',
    role: 'admin' as const,
    loginTime: new Date(),
    ...overrides,
  }
}

/**
 * Create mock anomaly data
 */
export function createMockAnomaly(overrides = {}) {
  return {
    id: 'test-anomaly-1',
    entity_id: 'entity-001',
    is_anomaly: true,
    anomaly_score: 0.85,
    severity: 'high' as const,
    explanation: 'Unusual activity detected',
    detected_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock forecast data
 */
export function createMockForecast(overrides = {}) {
  return {
    metric: 'enrolments',
    state: 'Maharashtra',
    forecast: [
      { date: '2026-01-09', predicted_value: 15000, lower_bound: 14000, upper_bound: 16000 },
      { date: '2026-01-10', predicted_value: 15500, lower_bound: 14500, upper_bound: 16500 },
    ],
    trend: 'increasing' as const,
    trend_strength: 0.8,
    model_version: '1.0.0',
    ...overrides,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Export custom render as default render
export { customRender as render }
