'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  FileCheck,
  Shield,
  Lock,
  CheckCircle,
  Clock,
  Hash,
  Copy,
  ExternalLink,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Database,
  GitBranch,
  Verified
} from 'lucide-react'
import { 
  AnimatedGrid,
  StatusBadge,
  AnimatedCounter,
  Footer
} from '@/components/ui'
import { auditRecords } from '@/lib/data'
import { formatDateTime, generateHash } from '@/lib/utils'

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<typeof auditRecords[0] | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const filteredRecords = auditRecords.filter(record => 
    record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.hash.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Mock blockchain stats
  const blockchainStats = {
    totalRecords: 12847,
    verifiedRecords: 12847,
    latestBlock: 'Block #894521',
    chainHealth: 100
  }

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
                Blockchain Audit Trail
              </h1>
              <p className="text-sm text-gati-muted">Immutable record of all governance actions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Chain Synced</span>
            </div>
            <Link href="/admin" className="gati-btn-secondary text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Blockchain Explanation */}
          <motion.div 
            className="bg-gradient-to-r from-gati-primary to-gati-secondary rounded-2xl p-8 mb-8 text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-4">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Trust & Transparency</span>
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">
                  Immutable Audit Trail
                </h2>
                <p className="text-white/80 leading-relaxed mb-6">
                  Every governance action in GATI is recorded on an immutable blockchain ledger. 
                  Each record is cryptographically hashed, timestamped, and linked to previous records, 
                  ensuring no action can be silently altered or deleted.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Verified className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Tamper-Proof</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm">Timestamped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">Cryptographic</span>
                  </div>
                </div>
              </div>
              
              {/* Visual representation */}
              <div className="hidden md:block">
                <div className="relative h-48">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${i * 25}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded bg-white/20" />
                      </div>
                      {i < 3 && (
                        <div className="absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-white/50 to-transparent" style={{ transform: 'translateY(-50%)' }} />
                      )}
                    </motion.div>
                  ))}
                  <motion.div
                    className="absolute left-0 right-0 bottom-0"
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent w-1/4" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-gati-accent" />
                <span className="text-xs text-gati-muted">Total Records</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">
                <AnimatedCounter value={blockchainStats.totalRecords} />
              </p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gati-muted">Verified</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                <AnimatedCounter value={blockchainStats.verifiedRecords} />
              </p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gati-muted">Latest Block</span>
              </div>
              <p className="text-lg font-bold text-gati-text">{blockchainStats.latestBlock}</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-gati-muted">Chain Health</span>
              </div>
              <p className="text-2xl font-bold text-cyan-600">{blockchainStats.chainHealth}%</p>
            </motion.div>
          </div>

          {/* Search & Filter */}
          <div className="gati-panel p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
                <input
                  type="text"
                  placeholder="Search by record ID, action, or hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="gati-input pl-10"
                />
              </div>
              <button className="gati-btn-secondary flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Audit Records Table */}
          <motion.div 
            className="gati-panel overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gati-text">Audit Log</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="gati-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Action</th>
                    <th>Related Issue</th>
                    <th>Timestamp</th>
                    <th>Hash</th>
                    <th>Model Version</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td>
                        <span className="font-mono text-sm text-gati-primary">{record.id}</span>
                      </td>
                      <td>
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                          ${record.action === 'Issue Resolved' ? 'bg-emerald-50 text-emerald-700' : ''}
                          ${record.action === 'Task Assigned' ? 'bg-purple-50 text-purple-700' : ''}
                          ${record.action === 'Anomaly Detected' ? 'bg-amber-50 text-amber-700' : ''}
                          ${record.action === 'Report Generated' ? 'bg-blue-50 text-blue-700' : ''}
                        `}>
                          {record.action}
                        </span>
                      </td>
                      <td>
                        {record.issueId ? (
                          <span className="font-mono text-xs text-gati-muted">{record.issueId}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm text-gati-muted">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(record.timestamp)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gati-muted truncate max-w-[120px]">
                            {record.hash.slice(0, 16)}...
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(record.hash)
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedHash === record.hash ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-gati-muted" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gati-muted">{record.modelVersion}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600">Verified</span>
                        </div>
                      </td>
                      <td>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ChevronRight className="w-4 h-4 text-gati-muted" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Record Detail Modal */}
          {selectedRecord && (
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedRecord(null)}
              />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gati-text">{selectedRecord.id}</h2>
                        <p className="text-sm text-gati-muted">{selectedRecord.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-700">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Timestamp */}
                  <div>
                    <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">
                      Timestamp
                    </label>
                    <p className="font-medium text-gati-text">{formatDateTime(selectedRecord.timestamp)}</p>
                  </div>

                  {/* Hash */}
                  <div>
                    <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">
                      Cryptographic Hash
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm text-gati-text break-all">{selectedRecord.hash}</span>
                      <button 
                        onClick={() => copyToClipboard(selectedRecord.hash)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0"
                      >
                        {copiedHash === selectedRecord.hash ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gati-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Related Issue */}
                  {selectedRecord.issueId && (
                    <div>
                      <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">
                        Related Issue
                      </label>
                      <Link 
                        href={`/admin/issues`}
                        className="inline-flex items-center gap-2 text-gati-accent hover:underline"
                      >
                        {selectedRecord.issueId}
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {/* Model Version */}
                  <div>
                    <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">
                      ML Model Version
                    </label>
                    <span className="font-mono text-sm text-gati-text">{selectedRecord.modelVersion}</span>
                  </div>

                  {/* Verified By */}
                  <div>
                    <label className="text-xs text-gati-muted uppercase tracking-wide mb-1 block">
                      Verified By
                    </label>
                    <span className="text-gati-text">{selectedRecord.verifiedBy}</span>
                  </div>

                  {/* Chain Verification */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Verified className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-emerald-800">Blockchain Verified</h4>
                        <p className="text-sm text-emerald-600">
                          This record is cryptographically secured and cannot be modified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button className="gati-btn-secondary text-sm flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View on Chain
                  </button>
                  <button 
                    className="gati-btn-ghost text-sm"
                    onClick={() => setSelectedRecord(null)}
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
