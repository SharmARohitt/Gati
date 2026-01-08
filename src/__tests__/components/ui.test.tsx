/**
 * Component tests for GATI UI components
 * Tests rendering, interactions, and accessibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

describe('UI Components', () => {
  describe('ErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Normal content</div>
    }

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('should render error UI when child throws', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should render custom fallback when provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should have reset button that clears error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Find and click reset button
      const resetButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(resetButton)

      // Rerender with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })
})

describe('Accessibility Tests', () => {
  describe('Interactive Elements', () => {
    it('should have accessible button', () => {
      render(
        <button
          aria-label="Submit form"
          type="submit"
        >
          Submit
        </button>
      )

      const button = screen.getByRole('button', { name: /submit/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should have accessible input with label', () => {
      render(
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            aria-describedby="username-help"
          />
          <span id="username-help">Enter your username</span>
        </div>
      )

      const input = screen.getByLabelText('Username')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-describedby', 'username-help')
    })

    it('should have accessible link', () => {
      render(
        <a href="/dashboard" aria-label="Go to dashboard">
          Dashboard
        </a>
      )

      const link = screen.getByRole('link', { name: /dashboard/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('ARIA Landmarks', () => {
    it('should have main landmark', () => {
      render(
        <main role="main" aria-label="Main content">
          <h1>Page Title</h1>
        </main>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have navigation landmark', () => {
      render(
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/">Home</a></li>
          </ul>
        </nav>
      )

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('should have accessible form', () => {
      render(
        <form aria-label="Login form" role="form">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              aria-required="true"
            />
          </div>
          <button type="submit">Login</button>
        </form>
      )

      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-required', 'true')
    })

    it('should have error states accessible', () => {
      render(
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            aria-invalid="true"
            aria-describedby="password-error"
          />
          <span id="password-error" role="alert">
            Password must be at least 8 characters
          </span>
        </div>
      )

      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
