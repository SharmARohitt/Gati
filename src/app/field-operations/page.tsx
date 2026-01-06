'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Phone,
  Mail,
  Navigation,
  Star,
  BarChart2,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import { 
  IndiaMap,
  StatusBadge,
  ProgressBar,
  AnimatedCounter,
  Footer
} from '@/components/ui'
import { fieldOfficers } from '@/lib/data'
import { formatIndianNumber } from '@/lib/utils'

export default function FieldOperationsPage() {
  const [selectedOfficer, setSelectedOfficer] = useState<typeof fieldOfficers[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const stats = {
    totalOfficers: fieldOfficers.length,
    activeOfficers: fieldOfficers.filter(o => o.status === 'active').length,
    inFieldOfficers: fieldOfficers.filter(o => o.status === 'in-field').length,
    totalTasksAssigned: fieldOfficers.reduce((acc, o) => acc + o.tasksAssigned, 0),
    totalTasksCompleted: fieldOfficers.reduce((acc, o) => acc + o.tasksCompleted, 0),
    avgResolutionRate: (fieldOfficers.reduce((acc, o) => acc + o.resolutionRate, 0) / fieldOfficers.length).toFixed(1)
  }

  const filteredOfficers = statusFilter === 'all' 
    ? fieldOfficers 
    : fieldOfficers.filter(o => o.status === statusFilter)

  // Mock unresolved issues heatmap data
  const heatmapRegions = [
    { region: 'Bihar', unresolvedCount: 42, trend: 'up' },
    { region: 'Jharkhand', unresolvedCount: 28, trend: 'down' },
    { region: 'Assam', unresolvedCount: 19, trend: 'up' },
    { region: 'Madhya Pradesh', unresolvedCount: 15, trend: 'stable' },
    { region: 'Rajasthan', unresolvedCount: 12, trend: 'down' }
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gati-muted" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-gati-primary">
                Field Operations & Officer Tracking
              </h1>
              <p className="text-sm text-gati-muted">Monitor field teams and task assignments</p>
            </div>
          </div>
          
          <Link href="/admin" className="gati-btn-secondary text-sm">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gati-accent" />
                <span className="text-xs text-gati-muted">Total Officers</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">{stats.totalOfficers}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gati-muted">Active</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.activeOfficers}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gati-muted">In Field</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.inFieldOfficers}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gati-muted">Assigned Tasks</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">{stats.totalTasksAssigned}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gati-muted">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">{formatIndianNumber(stats.totalTasksCompleted)}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gati-accent" />
                <span className="text-xs text-gati-muted">Avg Resolution</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">{stats.avgResolutionRate}%</p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Map & Heatmap */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Map */}
              <motion.div 
                className="gati-panel overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gati-text">Live Officer Locations</h2>
                    <p className="text-sm text-gati-muted">Real-time field team positions</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-gati-muted">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-gati-muted">In Field</span>
                    </div>
                  </div>
                </div>
                <div className="h-80 relative">
                  <IndiaMap mode="health" showLabels={false} interactive={false} />
                  
                  {/* Officer markers overlay */}
                  {fieldOfficers.map((officer, index) => (
                    <motion.div
                      key={officer.id}
                      className={`
                        absolute w-4 h-4 rounded-full cursor-pointer
                        ${officer.status === 'active' ? 'bg-emerald-500' : 'bg-blue-500'}
                      `}
                      style={{
                        left: `${30 + index * 15}%`,
                        top: `${30 + index * 10}%`
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      onClick={() => setSelectedOfficer(officer)}
                      title={officer.name}
                    >
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gati-text whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        {officer.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Unresolved Issues Heatmap */}
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gati-text">Unresolved Issues by Region</h2>
                  <span className="text-sm text-gati-muted">Priority areas</span>
                </div>
                
                <div className="space-y-3">
                  {heatmapRegions.map((item, index) => (
                    <div key={item.region} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gati-text">{item.region}</div>
                      <div className="flex-1">
                        <ProgressBar 
                          value={item.unresolvedCount} 
                          max={50}
                          showLabel={false}
                          size="default"
                          color={
                            item.unresolvedCount > 30 ? 'bg-red-500' :
                            item.unresolvedCount > 20 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="font-semibold text-gati-text">{item.unresolvedCount}</span>
                        <span className="text-xs text-gati-muted ml-1">issues</span>
                      </div>
                      <div className={`
                        text-xs font-medium px-2 py-0.5 rounded
                        ${item.trend === 'up' ? 'bg-red-50 text-red-600' : ''}
                        ${item.trend === 'down' ? 'bg-emerald-50 text-emerald-600' : ''}
                        ${item.trend === 'stable' ? 'bg-gray-50 text-gray-600' : ''}
                      `}>
                        {item.trend === 'up' && '↑ Rising'}
                        {item.trend === 'down' && '↓ Falling'}
                        {item.trend === 'stable' && '→ Stable'}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Officers List */}
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
                  <input
                    type="text"
                    placeholder="Search officers..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gati-accent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gati-accent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="in-field">In Field</option>
                </select>
              </div>

              {/* Officers List */}
              <motion.div 
                className="gati-panel overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gati-text">Field Officers</h2>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filteredOfficers.map((officer) => (
                    <div 
                      key={officer.id}
                      className={`
                        p-4 cursor-pointer transition-colors
                        ${selectedOfficer?.id === officer.id ? 'bg-gati-light/20' : 'hover:bg-gray-50'}
                      `}
                      onClick={() => setSelectedOfficer(officer)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shrink-0">
                          <span className="text-white font-semibold">
                            {officer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gati-text truncate">{officer.name}</h3>
                            <StatusBadge status={officer.status as any} size="small" />
                          </div>
                          <p className="text-sm text-gati-muted">{officer.designation}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gati-muted">
                            <MapPin className="w-3 h-3" />
                            <span>{officer.region}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-gati-muted">Tasks: </span>
                            <span className="font-medium text-gati-text">{officer.tasksAssigned}</span>
                          </div>
                          <div>
                            <span className="text-gati-muted">Rate: </span>
                            <span className="font-medium text-emerald-600">{officer.resolutionRate}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gati-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Officer Detail Modal */}
          {selectedOfficer && (
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedOfficer(null)}
              />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gati-primary to-gati-secondary">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {selectedOfficer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-white">
                      <h2 className="text-xl font-bold">{selectedOfficer.name}</h2>
                      <p className="text-white/80">{selectedOfficer.designation}</p>
                      <p className="text-sm text-white/60">{selectedOfficer.id}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Status & Location */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={selectedOfficer.status as any} />
                    <div className="flex items-center gap-2 text-gati-muted">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOfficer.region}</span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="gati-panel p-4 text-center">
                      <p className="text-2xl font-bold text-gati-text">{selectedOfficer.tasksAssigned}</p>
                      <p className="text-xs text-gati-muted">Assigned</p>
                    </div>
                    <div className="gati-panel p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{selectedOfficer.tasksCompleted}</p>
                      <p className="text-xs text-gati-muted">Completed</p>
                    </div>
                    <div className="gati-panel p-4 text-center">
                      <p className="text-2xl font-bold text-gati-accent">{selectedOfficer.resolutionRate}%</p>
                      <p className="text-xs text-gati-muted">Resolution Rate</p>
                    </div>
                    <div className="gati-panel p-4 text-center">
                      <p className="text-2xl font-bold text-gati-text">{selectedOfficer.avgResolutionTime}</p>
                      <p className="text-xs text-gati-muted">Avg Time</p>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gati-muted">Overall Performance</span>
                      <span className="font-medium text-gati-text">{selectedOfficer.resolutionRate}%</span>
                    </div>
                    <ProgressBar 
                      value={selectedOfficer.resolutionRate} 
                      showLabel={false}
                      color={selectedOfficer.resolutionRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}
                    />
                  </div>

                  {/* Contact Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 gati-btn-primary flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Call Officer
                    </button>
                    <button className="flex-1 gati-btn-secondary flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Message
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
                  <button className="text-sm text-gati-muted hover:text-gati-primary transition-colors">
                    View Full Profile
                  </button>
                  <button 
                    className="text-sm text-gati-muted hover:text-gati-primary transition-colors"
                    onClick={() => setSelectedOfficer(null)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
