'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, TopBar } from '@/components/ui'
import { useAuth } from '@/components/auth/AuthProviderWrapper'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Once Firebase has resolved the auth state, redirect if not logged in
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?returnUrl=/admin')
    }
  }, [isAuthenticated, isLoading, router])

  // Show spinner while Firebase resolves auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0A2463]/20 border-t-[#0A2463] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#0A2463] font-semibold text-sm">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  // Don't render children until auth is confirmed
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <TopBar sidebarCollapsed={sidebarCollapsed} />
      <main
        className="pt-16 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
      >
        {children}
      </main>
    </div>
  )
}
