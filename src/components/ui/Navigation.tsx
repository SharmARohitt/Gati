'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  Brain,
  AlertTriangle,
  ShieldCheck,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  Shield
} from 'lucide-react'
import { PulsingDot } from './AnimatedElements'
import { useAuth } from '@/lib/auth/authContext'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'digital-twin', label: 'India Digital Twin', icon: Map, href: '/digital-twin' },
  { id: 'intelligence', label: 'AI Intelligence', icon: Brain, href: '/intelligence' },
  { id: 'issues', label: 'Issues & Tasks', icon: AlertTriangle, href: '/admin/issues', badge: 5 },
  { id: 'verification', label: 'Verification Console', icon: ShieldCheck, href: '/verification' },
  { id: 'field-ops', label: 'Field Operations', icon: Users, href: '/field-operations' },
  { id: 'blockchain', label: 'Audit & Blockchain', icon: FileCheck, href: '/audit' },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, href: '/analytics' },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-40 flex flex-col"
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shadow-gati">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display font-bold text-gati-primary text-lg">GATI</h1>
              <p className="text-[10px] text-gati-muted leading-tight">Governance & Aadhaar<br />Tracking Intelligence</p>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 ease-out relative
                ${isActive
                  ? 'bg-gradient-to-r from-gati-primary to-gati-secondary text-white shadow-gati'
                  : 'text-gati-muted hover:bg-gati-light/20 hover:text-gati-primary'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!collapsed && (
                <motion.span
                  className="font-medium text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg
          text-gati-muted hover:bg-gati-light/20 hover:text-gati-primary
          transition-all duration-200
        `}>
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </button>
        <button 
          onClick={handleLogout}
          className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg
          text-red-500 hover:bg-red-50
          transition-all duration-200
        `}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gati-muted hover:text-gati-primary transition-colors"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </motion.aside>
  )
}

interface TopBarProps {
  sidebarCollapsed?: boolean
}

export function TopBar({ sidebarCollapsed = false }: TopBarProps) {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <motion.header
      className="fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 flex items-center justify-between px-6"
      initial={false}
      animate={{ left: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
        <input
          type="text"
          placeholder="Search states, districts, issues..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-gati-accent focus:ring-2 focus:ring-gati-accent/20 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs text-gati-muted bg-gray-100 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
          <PulsingDot color="bg-emerald-500" size="w-2 h-2" />
          <span className="text-xs font-medium text-emerald-700">System Live</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gati-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Info */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gati-saffron/10 to-gati-green/10 rounded-lg border border-gati-saffron/20">
              <Shield className="w-4 h-4 text-gati-saffron" />
              <div className="text-right">
                <p className="text-sm font-medium text-gati-text">{user.username}</p>
                <p className="text-xs text-gati-muted capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link 
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gati-saffron to-gati-green text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Login</span>
          </Link>
        )}
      </div>
    </motion.header>
  )
}

// Footer for landing pages
export function Footer() {
  return (
    <footer className="bg-gati-primary text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">GATI</h3>
                <p className="text-xs text-gati-light">Governance & Aadhaar Tracking Intelligence</p>
              </div>
            </div>
            <p className="text-gati-light/80 text-sm leading-relaxed max-w-md">
              A national AI-driven system that transforms Aadhaar data into predictive governance, 
              field action, and citizen impact. India's Digital Nervous System.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gati-light/80">
              <li><Link href="/digital-twin" className="hover:text-white transition-colors">India Digital Twin</Link></li>
              <li><Link href="/intelligence" className="hover:text-white transition-colors">AI Intelligence</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Admin Console</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gati-light/80">
              <li>UIDAI Headquarters</li>
              <li>Bangla Sahib Road</li>
              <li>New Delhi - 110001</li>
              <li className="pt-2">
                <a href="mailto:contact@uidai.gov.in" className="hover:text-white transition-colors">
                  contact@uidai.gov.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gati-light/60">
            © 2025 GATI Platform. Government of India. All rights reserved.
          </p>
          <p className="text-sm text-gati-accent font-medium">
            GATI – Turning Identity Data into Governance Action
          </p>
        </div>
      </div>
    </footer>
  )
}
