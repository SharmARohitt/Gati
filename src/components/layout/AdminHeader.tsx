'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, 
  LogOut, 
  Fingerprint, 
  LayoutDashboard, 
  BarChart3, 
  Brain, 
  FileCheck, 
  MapPin, 
  Cpu,
  UserCheck,
  Home
} from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'

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
  const { user, logout, isAuthenticated } = useAuth()
  const pathname = usePathname()

  if (!isAuthenticated) return null

  return (
    <header className="bg-white border-b border-gati-gray shadow-sm sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
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

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gati-saffron/5 to-gati-green/5 rounded-lg border border-gati-gray">
              <Shield className="w-4 h-4 text-gati-saffron" />
              <div className="text-right">
                <p className="text-sm font-medium text-gati-blue leading-none">{user?.username}</p>
                <p className="text-[10px] text-gati-gray-dark">{user?.role}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
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
