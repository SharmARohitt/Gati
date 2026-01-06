'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  Download,
  ChevronDown,
  MapPin,
  Clock,
  User,
  Brain,
  ArrowRight,
  X,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react'
import { 
  StatusBadge, 
  SeverityBadge, 
  ConfidenceMeter,
  ProgressBar
} from '@/components/ui'
import { detectedIssues, fieldOfficers } from '@/lib/data'
import { formatDate } from '@/lib/utils'

type FilterSeverity = 'all' | 'low' | 'medium' | 'high' | 'critical'
type FilterStatus = 'all' | 'pending' | 'assigned' | 'in-progress' | 'resolved'

export default function IssuesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedIssue, setSelectedIssue] = useState<typeof detectedIssues[0] | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const filteredIssues = detectedIssues.filter(issue => {
    const matchesSearch = 
      issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.region.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const issueStats = {
    total: detectedIssues.length,
    pending: detectedIssues.filter(i => i.status === 'pending').length,
    assigned: detectedIssues.filter(i => i.status === 'assigned').length,
    inProgress: detectedIssues.filter(i => i.status === 'in-progress').length,
    resolved: detectedIssues.filter(i => i.status === 'resolved').length,
    critical: detectedIssues.filter(i => i.severity === 'critical').length
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gati-primary mb-1">
          Issues & Task Management
        </h1>
        <p className="text-gati-muted">AI-detected issues requiring attention and field verification</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <motion.div 
          className="gati-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-bold text-gati-text">{issueStats.total}</p>
          <p className="text-xs text-gati-muted">Total Issues</p>
        </motion.div>
        <motion.div 
          className="gati-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-2xl font-bold text-amber-600">{issueStats.pending}</p>
          <p className="text-xs text-gati-muted">Pending</p>
        </motion.div>
        <motion.div 
          className="gati-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-2xl font-bold text-purple-600">{issueStats.assigned}</p>
          <p className="text-xs text-gati-muted">Assigned</p>
        </motion.div>
        <motion.div 
          className="gati-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-2xl font-bold text-cyan-600">{issueStats.inProgress}</p>
          <p className="text-xs text-gati-muted">In Progress</p>
        </motion.div>
        <motion.div 
          className="gati-panel p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-2xl font-bold text-emerald-600">{issueStats.resolved}</p>
          <p className="text-xs text-gati-muted">Resolved</p>
        </motion.div>
        <motion.div 
          className="gati-panel p-4 border-l-4 border-purple-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-2xl font-bold text-purple-600">{issueStats.critical}</p>
          <p className="text-xs text-gati-muted">Critical</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="gati-panel p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
            <input
              type="text"
              placeholder="Search issues by ID, type, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gati-input pl-10"
            />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
              className="gati-select min-w-[150px]"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="gati-select min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Export */}
          <button className="gati-btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Issues Table */}
      <motion.div 
        className="gati-panel overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="gati-table">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Type</th>
                <th>Region</th>
                <th>Severity</th>
                <th>Status</th>
                <th>AI Confidence</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr 
                  key={issue.id} 
                  className="cursor-pointer"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td>
                    <span className="font-mono text-sm text-gati-primary">{issue.id}</span>
                  </td>
                  <td>
                    <span className="font-medium text-gati-text">{issue.type}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-gati-muted">
                      <MapPin className="w-3 h-3" />
                      <span className="text-sm">{issue.region}</span>
                    </div>
                  </td>
                  <td>
                    <SeverityBadge severity={issue.severity as any} />
                  </td>
                  <td>
                    <StatusBadge status={issue.status as any} size="small" />
                  </td>
                  <td>
                    <div className="w-24">
                      <ConfidenceMeter confidence={issue.confidence} />
                    </div>
                  </td>
                  <td>
                    {issue.deadline ? (
                      <div className="flex items-center gap-1 text-sm text-gati-muted">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(issue.deadline)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gati-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {issue.status === 'pending' && (
                        <button 
                          className="px-3 py-1 text-xs font-medium bg-gati-primary text-white rounded-lg hover:bg-gati-secondary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIssue(issue)
                            setShowAssignModal(true)
                          }}
                        >
                          Assign
                        </button>
                      )}
                      <button className="p-1 text-gati-muted hover:text-gati-primary transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredIssues.length === 0 && (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gati-muted mx-auto mb-4" />
            <p className="text-gati-muted">No issues found matching your criteria</p>
          </div>
        )}
      </motion.div>

      {/* Issue Detail Sidebar */}
      <AnimatePresence>
        {selectedIssue && !showAssignModal && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="flex-1 bg-black/20 backdrop-blur-sm"
              onClick={() => setSelectedIssue(null)}
            />
            <motion.div
              className="w-[480px] bg-white shadow-2xl overflow-y-auto"
              initial={{ x: 500 }}
              animate={{ x: 0 }}
              exit={{ x: 500 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                <div>
                  <span className="font-mono text-sm text-gati-muted">{selectedIssue.id}</span>
                  <h2 className="text-xl font-bold text-gati-text">{selectedIssue.type}</h2>
                </div>
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gati-muted" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Severity */}
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={selectedIssue.severity as any} />
                  <StatusBadge status={selectedIssue.status as any} />
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">Location</label>
                  <div className="flex items-center gap-2 text-gati-text">
                    <MapPin className="w-4 h-4 text-gati-accent" />
                    <span className="font-medium">{selectedIssue.region}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">Description</label>
                  <p className="text-gati-text">{selectedIssue.description}</p>
                </div>

                {/* AI Insight */}
                <div className="gati-panel-glow p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold text-gati-text">AI Insight</span>
                  </div>
                  <p className="text-sm text-gati-muted leading-relaxed">{selectedIssue.aiInsight}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gati-muted">Model Confidence</span>
                      <span className="font-medium text-gati-text">{selectedIssue.confidence}%</span>
                    </div>
                    <ProgressBar value={selectedIssue.confidence} showLabel={false} size="small" />
                  </div>
                </div>

                {/* Assignment */}
                {selectedIssue.assignedTo && (
                  <div>
                    <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">Assigned To</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gati-text block">{selectedIssue.assignedTo}</span>
                        {selectedIssue.deadline && (
                          <span className="text-xs text-gati-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {formatDate(selectedIssue.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {selectedIssue.status === 'pending' && (
                    <button 
                      className="w-full gati-btn-primary"
                      onClick={() => setShowAssignModal(true)}
                    >
                      Assign to Officer
                    </button>
                  )}
                  {selectedIssue.status === 'in-progress' && (
                    <button className="w-full gati-btn-primary flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                  )}
                  <button className="w-full gati-btn-secondary">
                    View Full Timeline
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && selectedIssue && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAssignModal(false)}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gati-text">Assign Issue</h2>
                <p className="text-sm text-gati-muted">{selectedIssue.id} - {selectedIssue.type}</p>
              </div>

              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gati-muted mb-4">Select an officer to assign this issue:</p>
                
                {fieldOfficers.map((officer) => (
                  <div 
                    key={officer.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gati-accent hover:bg-gati-light/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {officer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gati-text">{officer.name}</h3>
                        <p className="text-sm text-gati-muted">{officer.designation} • {officer.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gati-text">{officer.tasksAssigned} tasks</span>
                      <p className="text-xs text-gati-muted">{officer.resolutionRate}% resolution rate</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button 
                  className="flex-1 gati-btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 gati-btn-primary"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedIssue(null)
                  }}
                >
                  Assign & Notify
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
