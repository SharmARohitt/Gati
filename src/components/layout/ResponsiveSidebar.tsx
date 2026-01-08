/**
 * GATI Responsive Sidebar Component
 * Collapsible sidebar with responsive behavior for desktop and tablet
 */

'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Brain,
  FileCheck,
  Users,
  Layers,
  Shield,
  Settings,
  HelpCircle,
  Fingerprint,
  Activity,
  Map,
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProviderWrapper'
import { useSidebar } from '@/lib/store'

// ============================================
// Types
// ============================================

interface NavGroup {
  title: string
  items: NavItem[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  description?: string
}

// ============================================
// Navigation Groups
// ============================================

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: Home, description: 'Main dashboard overview' },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, description: 'View detailed analytics' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/intelligence', label: 'AI Hub', icon: Brain, description: 'AI-powered insights' },
      { href: '/digital-twin', label: 'Digital Twin', icon: Layers, description: '3D simulation view' },
      { href: '/ml-pipeline', label: 'ML Pipeline', icon: Activity, description: 'Machine learning status' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/audit', label: 'Audit Trail', icon: FileCheck, description: 'System audit logs' },
      { href: '/field-operations', label: 'Field Ops', icon: Users, description: 'Field officer management' },
      { href: '/states', label: 'State Data', icon: Map, description: 'State-wise statistics' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, description: 'System configuration' },
      { href: '/help', label: 'Help', icon: HelpCircle, description: 'Documentation & support' },
    ],
  },
]

// ============================================
// Responsive Sidebar Component
// ============================================

export function ResponsiveSidebar() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const { sidebarCollapsed: isCollapsed, toggleSidebar, setSidebarCollapsed: setCollapsed } = useSidebar()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleToggle = useCallback(() => {
    toggleSidebar()
  }, [toggleSidebar])

  // Don't render sidebar for unauthenticated users
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 bg-white border-r border-gray-200 shadow-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-100`}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-lg flex items-center justify-center shadow-md">
                <Fingerprint className="w-5 h-5 text-gati-blue" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-gati-primary block">GATI</span>
                <span className="text-xs text-gray-500">Governance Platform</span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/" className="flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-lg flex items-center justify-center shadow-md">
                <Fingerprint className="w-5 h-5 text-gati-blue" />
              </div>
            </Link>
          )}

          {!isCollapsed && (
            <button
              onClick={handleToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              {/* Group Title */}
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}

              {/* Group Items */}
              <ul className="space-y-1 px-3" role="list">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        onMouseEnter={() => isCollapsed && setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                          isActive
                            ? 'bg-gati-primary text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon 
                          className={`w-5 h-5 flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                          }`} 
                          aria-hidden="true" 
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                isActive ? 'bg-white/20 text-white' : 'bg-gati-primary/10 text-gati-primary'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>

                      {/* Tooltip for collapsed state */}
                      <AnimatePresence>
                        {isCollapsed && hoveredItem === item.href && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-full top-0 ml-2 z-50 pointer-events-none"
                          >
                            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                              <p className="font-medium">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className={`border-t border-gray-100 p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gati-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
              </div>
            ) : (
              <div 
                className="w-10 h-10 bg-gati-primary rounded-full flex items-center justify-center text-white font-semibold"
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Expand Button (when collapsed) */}
        {isCollapsed && (
          <button
            onClick={handleToggle}
            className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </motion.aside>

      {/* Content Spacer */}
      <div 
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-[280px]'
        }`}
        aria-hidden="true"
      />
    </>
  )
}

// ============================================
// Mini Sidebar (Tablet)
// ============================================

export function MiniSidebar() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const quickNavItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/intelligence', label: 'AI Hub', icon: Brain },
    { href: '/audit', label: 'Audit', icon: FileCheck },
    { href: '/field-operations', label: 'Field Ops', icon: Users },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <aside
      className="hidden md:flex lg:hidden flex-col fixed left-0 top-0 bottom-0 z-30 w-16 bg-white border-r border-gray-200"
      role="navigation"
      aria-label="Quick navigation"
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center p-3 border-b border-gray-100"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-lg flex items-center justify-center shadow-md">
          <Fingerprint className="w-5 h-5 text-gati-blue" />
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-2" role="list">
          {quickNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`flex items-center justify-center p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gati-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </Link>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none"
                    >
                      <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                        {item.label}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-gray-100">
        <Link
          href="/settings"
          className="flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </aside>
  )
}

// ============================================
// Export
// ============================================

export default ResponsiveSidebar
