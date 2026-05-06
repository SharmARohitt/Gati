'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  MapPin,
  Clock,
  User,
  Brain,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Loader2,
  UserCheck,
  Activity,
  Circle,
} from 'lucide-react'
import {
  StatusBadge,
  SeverityBadge,
  ConfidenceMeter,
  ProgressBar,
} from '@/components/ui'
import { detectedIssues, fieldOfficers } from '@/lib/data'
import { formatDate } from '@/lib/utils'
import { toastSuccess, toastInfo } from '@/components/ui/Toast'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueStatus = 'pending' | 'assigned' | 'in-progress' | 'resolved'
type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
type FilterStatus = 'all' | IssueStatus
type FilterSeverity = 'all' | IssueSeverity

interface Issue {
  id: string
  type: string
  region: string
  severity: string
  status: string
  assignedTo: string | null
  deadline: string | null
  confidence: number
  description: string
  aiInsight: string
}

// ─── Status cycle ─────────────────────────────────────────────────────────────

const STATUS_CYCLE: IssueStatus[] = ['pending', 'assigned', 'in-progress', 'resolved']

function nextStatus(current: string): IssueStatus {
  const idx = STATUS_CYCLE.indexOf(current as IssueStatus)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

// ─── Stat card colours ────────────────────────────────────────────────────────

const STAT_STYLES: Record<string, { num: string; ring: string }> = {
  total:      { num: 'text-[var(--gati-text)]',    ring: 'ring-[var(--gati-border)]' },
  pending:    { num: 'text-amber-500',              ring: 'ring-amber-400' },
  assigned:   { num: 'text-purple-500',             ring: 'ring-purple-400' },
  inProgress: { num: 'text-cyan-500',               ring: 'ring-cyan-400' },
  resolved:   { num: 'text-emerald-500',            ring: 'ring-emerald-400' },
  critical:   { num: 'text-red-500',                ring: 'ring-red-400' },
}

// ─── Status icon helper ───────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':    return <Circle className="w-3.5 h-3.5 text-amber-500" />
    case 'assigned':   return <UserCheck className="w-3.5 h-3.5 text-purple-500" />
    case 'in-progress': return <Activity className="w-3.5 h-3.5 text-cyan-500" />
    case 'resolved':   return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    default:           return null
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IssuesPage() {
  // Local mutable copy of issues for optimistic updates
  const [issues, setIssues] = useState<Issue[]>(() =>
    detectedIssues.map(i => ({ ...i }))
  )
  const [searchQuery, setSearchQuery]       = useState('')
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
  const [filterStatus, setFilterStatus]     = useState<FilterStatus>('all')
  const [selectedIssue, setSelectedIssue]   = useState<Issue | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningId, setAssigningId]       = useState<string | null>(null)

  // ── Derived stats ──────────────────────────────────────────────────────────

  const stats = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'pending').length,
    assigned:   issues.filter(i => i.status === 'assigned').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved:   issues.filter(i => i.status === 'resolved').length,
    critical:   issues.filter(i => i.severity === 'critical').length,
  }

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = issues.filter(issue => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      issue.id.toLowerCase().includes(q) ||
      issue.type.toLowerCase().includes(q) ||
      issue.region.toLowerCase().includes(q)
    const matchSeverity = filterSeverity === 'all' || issue.severity === filterSeverity
    const matchStatus   = filterStatus   === 'all' || issue.status   === filterStatus
    return matchSearch && matchSeverity && matchStatus
  })

  // ── Optimistic helpers ─────────────────────────────────────────────────────

  const updateIssue = useCallback((id: string, patch: Partial<Issue>) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    setSelectedIssue(prev => prev?.id === id ? { ...prev, ...patch } : prev)
  }, [])

  const cycleStatus = useCallback((issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = nextStatus(issue.status)
    updateIssue(issue.id, { status: next })
    toastInfo(`Status → ${next.replace('-', ' ')}`, { duration: 2000 })
  }, [updateIssue])

  const assignOfficer = useCallback((officer: typeof fieldOfficers[0]) => {
    if (!selectedIssue) return
    setAssigningId(officer.id)
    // Optimistic — instant
    updateIssue(selectedIssue.id, {
      status: 'assigned',
      assignedTo: officer.name,
    })
    setTimeout(() => {
      setAssigningId(null)
      setShowAssignModal(false)
      toastSuccess(`✓ Assigned to ${officer.name}`, { duration: 3000 })
    }, 300)
  }, [selectedIssue, updateIssue])

  const markResolved = useCallback(() => {
    if (!selectedIssue) return
    updateIssue(selectedIssue.id, { status: 'resolved' })
    toastSuccess('✓ Issue marked as resolved', { duration: 3000 })
    setSelectedIssue(null)
  }, [selectedIssue, updateIssue])

  // ── Stat card click → filter ───────────────────────────────────────────────

  const handleStatClick = (key: FilterStatus) => {
    setFilterStatus(prev => prev === key ? 'all' : key)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 min-h-screen" style={{ background: 'var(--gati-bg, #f8fafc)' }}>

      {/* ── Header ── */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-display font-bold text-gati-primary mb-1">
          Issues &amp; Task Management
        </h1>
        <p style={{ color: 'var(--gati-muted)' }}>
          AI-detected issues requiring attention and field verification
        </p>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(
          [
            { key: 'all',        label: 'Total',       value: stats.total,      style: STAT_STYLES.total },
            { key: 'pending',    label: 'Pending',     value: stats.pending,    style: STAT_STYLES.pending },
            { key: 'assigned',   label: 'Assigned',    value: stats.assigned,   style: STAT_STYLES.assigned },
            { key: 'in-progress',label: 'In Progress', value: stats.inProgress, style: STAT_STYLES.inProgress },
            { key: 'resolved',   label: 'Resolved',    value: stats.resolved,   style: STAT_STYLES.resolved },
            { key: 'critical',   label: 'Critical',    value: stats.critical,   style: STAT_STYLES.critical },
          ] as const
        ).map(({ key, label, value, style }, i) => {
          const active = filterStatus === key || (key === 'critical' && filterSeverity === 'critical')
          return (
            <motion.button
              key={key}
              onClick={() => {
                if (key === 'critical') {
                  setFilterSeverity(prev => prev === 'critical' ? 'all' : 'critical')
                } else {
                  handleStatClick(key as FilterStatus)
                }
              }}
              className={[
                'gati-panel p-4 text-left transition-all duration-150 cursor-pointer select-none',
                active ? `ring-2 ${style.ring}` : 'hover:ring-1 hover:ring-[var(--gati-border)]',
              ].join(' ')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <p className={`text-2xl font-bold tabular-nums ${style.num}`}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--gati-muted)' }}>{label}</p>
            </motion.button>
          )
        })}
      </div>

      {/* ── Filters ── */}
      <motion.div
        className="gati-panel p-4 mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--gati-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID, type, or region…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="gati-input pl-10 w-full"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value as FilterSeverity)}
            className="gati-select min-w-[140px]"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="gati-select min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <button className="gati-btn-secondary flex items-center gap-2 ml-auto">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* ── Issues table ── */}
      <motion.div
        className="gati-panel overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-x-auto">
          <table className="gati-table w-full">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Type</th>
                <th>Region</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map(issue => (
                  <motion.tr
                    key={issue.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className="cursor-pointer"
                    onClick={() => { setSelectedIssue(issue); setShowAssignModal(false) }}
                  >
                    <td>
                      <span className="font-mono text-sm text-gati-primary">{issue.id}</span>
                    </td>
                    <td>
                      <span className="font-medium" style={{ color: 'var(--gati-text)' }}>{issue.type}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ color: 'var(--gati-muted)' }}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-sm">{issue.region}</span>
                      </div>
                    </td>
                    <td>
                      <SeverityBadge severity={issue.severity as any} />
                    </td>
                    <td>
                      {/* Clickable status badge cycles through statuses */}
                      <button
                        onClick={e => cycleStatus(issue, e)}
                        title="Click to cycle status"
                        className="flex items-center gap-1.5 group"
                      >
                        <StatusBadge status={issue.status as any} size="small" />
                        <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--gati-muted)' }} />
                      </button>
                    </td>
                    <td>
                      <div className="w-24">
                        <ConfidenceMeter confidence={issue.confidence} />
                      </div>
                    </td>
                    <td>
                      {issue.deadline ? (
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--gati-muted)' }}>
                          <Clock className="w-3 h-3" />
                          {formatDate(issue.deadline)}
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--gati-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {issue.status === 'pending' && (
                          <button
                            className="px-3 py-1 text-xs font-medium bg-gati-primary text-white rounded-lg hover:bg-gati-secondary transition-colors"
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedIssue(issue)
                              setShowAssignModal(true)
                            }}
                          >
                            Assign
                          </button>
                        )}
                        <button
                          className="p-1 transition-colors"
                          style={{ color: 'var(--gati-muted)' }}
                          onClick={e => { e.stopPropagation(); setSelectedIssue(issue); setShowAssignModal(false) }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <motion.div
            className="p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--gati-muted)' }} />
            <p style={{ color: 'var(--gati-muted)' }}>No issues match your filters</p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Issue detail sidebar ── */}
      <AnimatePresence>
        {selectedIssue && !showAssignModal && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="flex-1 bg-black/25 backdrop-blur-[2px]"
              onClick={() => setSelectedIssue(null)}
            />

            {/* Panel */}
            <motion.div
              className="w-[480px] max-w-full overflow-y-auto shadow-2xl flex flex-col"
              style={{ background: 'var(--gati-card, #fff)', borderLeft: '1px solid var(--gati-border)' }}
              initial={{ x: 500 }}
              animate={{ x: 0 }}
              exit={{ x: 500 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              {/* Sticky header */}
              <div
                className="sticky top-0 z-10 p-5 flex items-start justify-between border-b"
                style={{ background: 'var(--gati-card, #fff)', borderColor: 'var(--gati-border)' }}
              >
                <div>
                  <span className="font-mono text-xs" style={{ color: 'var(--gati-muted)' }}>
                    {selectedIssue.id}
                  </span>
                  <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--gati-text)' }}>
                    {selectedIssue.type}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-2 rounded-lg transition-colors hover:bg-black/5"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--gati-muted)' }} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 flex-1">

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={selectedIssue.severity as any} />
                  <button
                    onClick={e => cycleStatus(selectedIssue, e)}
                    title="Click to cycle status"
                    className="flex items-center gap-1.5 group"
                  >
                    <StatusBadge status={selectedIssue.status as any} />
                    <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--gati-muted)' }} />
                  </button>
                </div>

                {/* Location */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: 'var(--gati-muted)' }}>
                    Location
                  </label>
                  <div className="flex items-center gap-2" style={{ color: 'var(--gati-text)' }}>
                    <MapPin className="w-4 h-4 text-gati-accent shrink-0" />
                    <span className="font-medium">{selectedIssue.region}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: 'var(--gati-muted)' }}>
                    Description
                  </label>
                  <p style={{ color: 'var(--gati-text)' }}>{selectedIssue.description}</p>
                </div>

                {/* AI Insight */}
                <div className="gati-panel-glow p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold" style={{ color: 'var(--gati-text)' }}>AI Insight</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--gati-muted)' }}>
                    {selectedIssue.aiInsight}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--gati-muted)' }}>Model Confidence</span>
                      <span className="font-medium" style={{ color: 'var(--gati-text)' }}>
                        {selectedIssue.confidence}%
                      </span>
                    </div>
                    <ProgressBar value={selectedIssue.confidence} showLabel={false} size="small" />
                  </div>
                </div>

                {/* Assigned officer */}
                {selectedIssue.assignedTo && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: 'var(--gati-muted)' }}>
                      Assigned To
                    </label>
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--gati-bg, #f8fafc)', border: '1px solid var(--gati-border)' }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium block" style={{ color: 'var(--gati-text)' }}>
                          {selectedIssue.assignedTo}
                        </span>
                        {selectedIssue.deadline && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--gati-muted)' }}>
                            <Clock className="w-3 h-3" />
                            Due: {formatDate(selectedIssue.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 space-y-2.5 border-t" style={{ borderColor: 'var(--gati-border)' }}>
                  {selectedIssue.status === 'pending' && (
                    <button
                      className="w-full gati-btn-primary"
                      onClick={() => setShowAssignModal(true)}
                    >
                      Assign to Officer
                    </button>
                  )}
                  {(selectedIssue.status === 'in-progress' || selectedIssue.status === 'assigned') && (
                    <button
                      className="w-full gati-btn-primary flex items-center justify-center gap-2"
                      onClick={markResolved}
                    >
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

      {/* ── Assign modal ── */}
      <AnimatePresence>
        {showAssignModal && selectedIssue && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAssignModal(false)}
            />

            <motion.div
              className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--gati-card, #fff)' }}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              {/* Modal header */}
              <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: 'var(--gati-border)' }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--gati-text)' }}>Assign Issue</h2>
                  <p className="text-sm" style={{ color: 'var(--gati-muted)' }}>
                    {selectedIssue.id} — {selectedIssue.type}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--gati-muted)' }} />
                </button>
              </div>

              {/* Officer list */}
              <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                <p className="text-sm mb-1" style={{ color: 'var(--gati-muted)' }}>
                  Select an officer to assign this issue:
                </p>
                {fieldOfficers.map(officer => (
                  <motion.button
                    key={officer.id}
                    className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all"
                    style={{ borderColor: 'var(--gati-border)', background: 'var(--gati-bg, #f8fafc)' }}
                    whileHover={{ scale: 1.01, borderColor: 'var(--gati-accent, #6366f1)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => assignOfficer(officer)}
                    disabled={assigningId !== null}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shrink-0">
                        {assigningId === officer.id ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {officer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--gati-text)' }}>{officer.name}</p>
                        <p className="text-xs" style={{ color: 'var(--gati-muted)' }}>
                          {officer.designation} · {officer.region}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--gati-text)' }}>
                        {officer.tasksAssigned} tasks
                      </p>
                      <p className="text-xs" style={{ color: 'var(--gati-muted)' }}>
                        {officer.resolutionRate}% resolved
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Modal footer */}
              <div
                className="p-5 border-t flex gap-3"
                style={{ borderColor: 'var(--gati-border)', background: 'var(--gati-bg, #f8fafc)' }}
              >
                <button
                  className="flex-1 gati-btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
