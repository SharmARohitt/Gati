/**
 * GATI Mobile Navigation Component
 * Responsive navigation with hamburger menu for mobile devices
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Home,
  BarChart3,
  Brain,
  FileCheck,
  Users,
  Layers,
  Shield,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  Fingerprint,
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProviderWrapper'
import { useNotifications } from '@/lib/store'
import { useFocusTrap } from '@/lib/a11y'

// ============================================
// Types
// ============================================

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  requiresAuth?: boolean
}

// ============================================
// Navigation Items
// ============================================

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/admin', label: 'Dashboard', icon: BarChart3, requiresAuth: true },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true },
  { href: '/intelligence', label: 'Intelligence Hub', icon: Brain, requiresAuth: true },
  { href: '/audit', label: 'Audit Trail', icon: FileCheck, requiresAuth: true },
  { href: '/field-operations', label: 'Field Operations', icon: Users, requiresAuth: true },
  { href: '/digital-twin', label: 'Digital Twin', icon: Layers, requiresAuth: true },
]

// ============================================
// Mobile Navigation
// ============================================

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const focusTrapRef = useFocusTrap(isOpen)

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    setIsOpen(false)
  }, [logout])

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-lg flex items-center justify-center shadow-md">
              <Fingerprint className="w-5 h-5 text-gati-blue" />
            </div>
            <span className="font-display font-bold text-xl text-gati-primary">GATI</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {isAuthenticated && (
              <button
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Hamburger Menu */}
            <button
              onClick={handleToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out Menu */}
            <motion.nav
              id="mobile-menu"
              ref={focusTrapRef as React.RefObject<HTMLElement>}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* User Info (if authenticated) */}
              {isAuthenticated && user && (
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gati-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3" role="list">
                  {navItems.map((item) => {
                    if (item.requiresAuth && !isAuthenticated) return null

                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-gati-primary/10 text-gati-primary font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Divider */}
                <div className="my-4 mx-4 border-t border-gray-100" />

                {/* Secondary Actions */}
                <ul className="space-y-1 px-3" role="list">
                  {isAuthenticated ? (
                    <>
                      <li>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="w-5 h-5" aria-hidden="true" />
                          <span>Settings</span>
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5" aria-hidden="true" />
                          <span>Logout</span>
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gati-primary text-white hover:bg-gati-primary/90 transition-colors"
                      >
                        <Shield className="w-5 h-5" aria-hidden="true" />
                        <span>Login</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  GATI v1.0.0 • Government of India
                </p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-16" />
    </>
  )
}

// ============================================
// Bottom Navigation (Mobile)
// ============================================

export function BottomNavigation() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  const bottomNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/admin', label: 'Dashboard', icon: BarChart3, requiresAuth: true },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true },
    { href: '/intelligence', label: 'AI Hub', icon: Brain, requiresAuth: true },
  ].filter(item => !item.requiresAuth || isAuthenticated)

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-gati-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-gati-primary' : ''}`} aria-hidden="true" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================
// Export
// ============================================

export default MobileNavigation
