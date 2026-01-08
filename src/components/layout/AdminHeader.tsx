'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Fingerprint, 
  LayoutDashboard, 
  BarChart3, 
  Brain, 
  FileCheck, 
  MapPin, 
  Cpu,
  UserCheck,
  Home,
  Bell,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProviderWrapper'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/intelligence', label: 'AI Intelligence', icon: <Brain className="w-4 h-4" /> },
  { href: '/audit', label: 'Audit Trail', icon: <FileCheck className="w-4 h-4" /> },
  { href: '/field-operations', label: 'Field Ops', icon: <MapPin className="w-4 h-4" /> },
  { href: '/digital-twin', label: 'Digital Twin', icon: <Cpu className="w-4 h-4" /> },
  { href: '/verification', label: 'Verification', icon: <UserCheck className="w-4 h-4" /> },
]

export function AdminHeader() {
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()
  const [refreshing, setRefreshing] = React.useState(false)
  const handleRefresh = () => {
    setRefreshing(true)
    window.location.reload()
  }

  if (!isAuthenticated) return null

  return (
    <header className="bg-white border-b border-gati-gray shadow-sm sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Top Left Section: Refresh, Live Data, Welcome */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-gati-muted ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm text-gati-text">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-gati-text">Live Data</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gati-saffron/10 to-gati-green/10 rounded-lg border border-gati-saffron/20">
                <Shield className="w-4 h-4 text-gati-saffron" />
                <span className="text-sm font-medium text-gati-blue">Welcome, {user?.username || 'User'}</span>
              </div>
            </div>
          </div>

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-xl flex items-center justify-center shadow-lg">
              <Fingerprint className="w-5 h-5 text-gati-blue" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gati-blue leading-none">GATI</h1>
              <p className="text-[10px] text-gati-gray-dark">Admin Portal</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-gati-saffron/10 to-gati-green/10 text-gati-blue border border-gati-saffron/20' 
                      : 'text-gati-gray-dark hover:bg-gati-gray-light hover:text-gati-blue'
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Notification Bell */}
          <button
            className="relative flex items-center justify-center w-10 h-10 bg-gati-gray-light hover:bg-gati-gray rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gati-gray-dark" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-gati-gray overflow-x-auto">
        <nav className="flex items-center gap-1 px-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-gati-blue text-white' 
                    : 'text-gati-gray-dark hover:bg-gati-gray-light'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
