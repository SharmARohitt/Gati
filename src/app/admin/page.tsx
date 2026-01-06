'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react'
import { 
  QuickStats,
  IndiaMap,
  MonthlyTrendsChart,
  RiskDistributionChart,
  StatusBadge,
  SeverityBadge,
  PulsingDot,
  AnimatedCounter
} from '@/components/ui'
import { detectedIssues, fieldOfficers } from '@/lib/data'
import { formatDateTime } from '@/lib/utils'

export default function AdminDashboard() {
  const recentIssues = detectedIssues.slice(0, 4)
  const activeOfficers = fieldOfficers.filter(o => o.status === 'active' || o.status === 'in-field')

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gati-primary">
            Admin Command Center
          </h1>
          <p className="text-gati-muted">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
          <PulsingDot color="bg-emerald-500" />
          <span className="text-sm font-medium text-gati-text">Last updated: Just now</span>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Map & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mini Map */}
          <motion.div 
            className="gati-panel overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gati-text">National Risk Overview</h2>
                <p className="text-sm text-gati-muted">Click to explore regions</p>
              </div>
              <Link 
                href="/digital-twin"
                className="text-sm text-gati-accent font-medium hover:underline flex items-center gap-1"
              >
                Open Digital Twin <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-80">
              <IndiaMap mode="risk" showLabels={false} interactive={true} />
            </div>
          </motion.div>

          {/* Monthly Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MonthlyTrendsChart />
          </motion.div>
        </div>

        {/* Right Column - Issues & Activity */}
        <div className="space-y-6">
          {/* Recent AI-Detected Issues */}
          <motion.div 
            className="gati-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gati-text">AI-Detected Issues</h2>
              </div>
              <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                {detectedIssues.filter(i => i.status !== 'resolved').length} Active
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gati-muted">{issue.id}</span>
                    <SeverityBadge severity={issue.severity as any} />
                  </div>
                  <h3 className="font-medium text-gati-text text-sm mb-1">{issue.type}</h3>
                  <div className="flex items-center gap-2 text-xs text-gati-muted mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{issue.region}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={issue.status as any} size="small" />
                    <span className="text-xs text-gati-muted">
                      Confidence: {issue.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/admin/issues"
                className="text-sm text-gati-accent font-medium hover:underline flex items-center justify-center gap-1"
              >
                View All Issues <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RiskDistributionChart />
          </motion.div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Field Officers */}
        <motion.div 
          className="gati-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gati-text">Active Field Officers</h2>
            </div>
            <Link 
              href="/field-operations"
              className="text-sm text-gati-accent font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {activeOfficers.map((officer) => (
              <div key={officer.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {officer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gati-text text-sm">{officer.name}</h3>
                    <p className="text-xs text-gati-muted">{officer.designation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <StatusBadge status={officer.status as any} size="small" />
                  </div>
                  <p className="text-xs text-gati-muted mt-1">{officer.tasksAssigned} tasks assigned</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="gati-panel p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-semibold text-gati-text mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Link 
              href="/admin/issues"
              className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-100 transition-colors">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gati-text">Manage Issues</span>
            </Link>
            
            <Link 
              href="/verification"
              className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 transition-colors">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gati-text">Verification Console</span>
            </Link>
            
            <Link 
              href="/field-operations"
              className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gati-text">Field Operations</span>
            </Link>
            
            <Link 
              href="/analytics"
              className="p-4 rounded-xl border border-gray-200 hover:border-gati-accent hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gati-text">Generate Reports</span>
            </Link>
          </div>
          
          {/* System Status */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gati-muted mb-3">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gati-text">Data Pipeline</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gati-text">ML Models</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gati-text">Blockchain Audit</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Synced</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
