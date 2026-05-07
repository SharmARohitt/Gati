'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Brain, AlertTriangle, ShieldCheck,
  Users, FileCheck, BarChart3, Settings, LogOut, ChevronLeft,
  Bell, Search, RefreshCw, Shield, Activity
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProviderWrapper'

const navigationItems = [
  { id: 'dashboard',    label: 'Dashboard',            icon: LayoutDashboard, href: '/admin' },
  { id: 'pulse',        label: 'Gati Pulse',           icon: Activity,        href: '/pulse', badge: 'LIVE' },
  { id: 'digital-twin', label: 'India Digital Twin',   icon: Map,             href: '/digital-twin' },
  { id: 'intelligence', label: 'AI Intelligence',      icon: Brain,           href: '/intelligence' },
  { id: 'issues',       label: 'Issues & Tasks',       icon: AlertTriangle,   href: '/admin/issues', badge: 5 },
  { id: 'verification', label: 'Verification Console', icon: ShieldCheck,     href: '/verification' },
  { id: 'field-ops',    label: 'Field Operations',     icon: Users,           href: '/field-operations' },
  { id: 'blockchain',   label: 'Audit & Blockchain',   icon: FileCheck,       href: '/audit' },
  { id: 'analytics',    label: 'Analytics & Reports',  icon: BarChart3,       href: '/analytics' },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen z-40 flex flex-col bg-white border-r border-gray-100"
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white font-bold text-lg select-none">G</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-display font-bold text-[#0A2463] text-base leading-none">GATI</div>
              <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
                Governance & Aadhaar<br />Tracking Intelligence
              </div>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group ${
                isActive
                  ? 'bg-gradient-to-r from-[#0A2463] to-[#1E5AA8] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A2463]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  item.badge === 'LIVE'
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-red-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                  item.badge === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5 flex-shrink-0">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
            pathname === '/settings'
              ? 'bg-gray-100 text-[#0A2463]'
              : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A2463]'
          }`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-[#0A2463] hover:border-[#0A2463] transition-colors"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </motion.aside>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  sidebarCollapsed?: boolean
}

export function TopBar({ sidebarCollapsed = false }: TopBarProps) {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    window.location.reload()
  }

  const notifications = [
    { id: 1, text: '5 new anomalies detected in Bihar', time: '2m ago', type: 'critical' },
    { id: 2, text: 'Jharkhand biometric update backlog rising', time: '15m ago', type: 'high' },
    { id: 3, text: 'Data load complete — 68 states aggregated', time: '1h ago', type: 'info' },
  ]

  return (
    <motion.header
      className="fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 z-30 flex items-center justify-between px-5"
      initial={false}
      animate={{ left: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Live Data</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm font-medium text-gray-700 max-w-[160px] truncate">
            {user?.fullName || user?.username || 'User'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search states, districts, issues…"
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/10 transition-all"
        />
      </div>

      {/* Right — bell only */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(v => !v)}
          className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        >
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900">Notifications</span>
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-semibold">
                    {notifications.length} new
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.type === 'critical' ? 'bg-red-500' :
                        n.type === 'high'     ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/admin/issues"
                    className="block text-center text-xs font-semibold text-[#1E5AA8] hover:text-[#0A2463] transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all issues →
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="bg-[#0A2463] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">GATI</h3>
                <p className="text-xs text-white/60">Governance & Aadhaar Tracking Intelligence</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              A national AI-driven system that transforms Aadhaar data into predictive governance,
              field action, and citizen impact. India's Digital Nervous System.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/digital-twin" className="hover:text-white transition-colors">India Digital Twin</Link></li>
              <li><Link href="/intelligence" className="hover:text-white transition-colors">AI Intelligence</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Admin Console</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Contact</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>UIDAI Headquarters</li>
              <li>Bangla Sahib Road, New Delhi</li>
              <li className="pt-1">
                <a href="mailto:contact@uidai.gov.in" className="hover:text-white transition-colors">
                  contact@uidai.gov.in
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">© 2026 GATI Platform. Government of India. All rights reserved.</p>
          <p className="text-sm text-[#00B4D8] font-medium">GATI – Turning Identity Data into Governance Action</p>
        </div>
      </div>
    </footer>
  )
}
