'use client'

import React, { useState } from 'react'
import { Sidebar, TopBar } from '@/components/ui'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
