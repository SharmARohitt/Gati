'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Calendar,
  Filter,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Cpu,
  FileSpreadsheet,
  File,
  Share2,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  AnimatedGrid,
  AnimatedCounter,
  Footer,
  TimelineChart,
  StateComparisonChart,
  AgeDistributionChart,
  RiskDistributionChart
} from '@/components/ui'
import { reportTemplates, stateData, ageDistribution } from '@/lib/data'
import { formatNumber, formatDateTime } from '@/lib/utils'

export default function AnalyticsPage() {
  const [selectedReportType, setSelectedReportType] = useState('all')
  const [dateRange, setDateRange] = useState('last-30')
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const reportTypes = [
    { id: 'all', name: 'All Reports' },
    { id: 'coverage', name: 'Coverage' },
    { id: 'performance', name: 'Performance' },
    { id: 'risk', name: 'Risk Assessment' },
    { id: 'field', name: 'Field Operations' }
  ]

  const dateRanges = [
    { id: 'last-7', name: 'Last 7 days' },
    { id: 'last-30', name: 'Last 30 days' },
    { id: 'last-90', name: 'Last 90 days' },
    { id: 'last-year', name: 'Last year' }
  ]

  const filteredReports = selectedReportType === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(r => r.type === selectedReportType)

  const handleGenerateReport = (reportId: string) => {
    setGeneratingReport(reportId)
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(null)
    }, 2000)
  }

  // AI-generated policy recommendations
  const aiRecommendations = [
    {
      id: 1,
      title: 'Increase Enrollment Camps in Rural Maharashtra',
      confidence: 94,
      impact: 'High',
      status: 'new',
      description: 'Based on coverage gap analysis, recommend setting up 50+ additional enrollment camps in Vidarbha region to achieve 99% saturation by Q2 2025.'
    },
    {
      id: 2,
      title: 'Deploy Additional Biometric Verification Officers in Bihar',
      confidence: 88,
      impact: 'Medium',
      status: 'reviewed',
      description: 'Anomaly detection suggests potential data quality issues in 3 districts. Recommend deploying 20 verification officers for field audits.'
    },
    {
      id: 3,
      title: 'Update Age-based Biometric Rules for Senior Citizens',
      confidence: 91,
      impact: 'High',
      status: 'implemented',
      description: 'Analysis shows 12% biometric mismatch in 70+ age group due to aging-related changes. Recommend relaxing fingerprint threshold for elderly.'
    }
  ]

  // Quick stats
  const reportStats = {
    totalGenerated: 847,
    lastGenerated: '2024-01-15 14:32',
    autoScheduled: 24,
    downloadedThisMonth: 156
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
                Analytics & Reports
              </h1>
              <p className="text-sm text-gati-muted">AI-powered insights and auto-generated reports</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="gati-btn-secondary text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Report
            </button>
            <Link href="/admin" className="gati-btn-ghost text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gati-accent" />
                <span className="text-xs text-gati-muted">Total Generated</span>
              </div>
              <p className="text-2xl font-bold text-gati-text">
                <AnimatedCounter value={reportStats.totalGenerated} />
              </p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gati-muted">Last Generated</span>
              </div>
              <p className="text-sm font-medium text-gati-text">Today, 14:32</p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gati-muted">Auto-Scheduled</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                <AnimatedCounter value={reportStats.autoScheduled} />
              </p>
            </motion.div>
            
            <motion.div 
              className="gati-panel p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-gati-muted">Downloaded (Month)</span>
              </div>
              <p className="text-2xl font-bold text-cyan-600">
                <AnimatedCounter value={reportStats.downloadedThisMonth} />
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline Chart */}
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gati-text">Coverage Growth Trend</h2>
                  <select 
                    className="gati-select text-sm"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    {dateRanges.map(range => (
                      <option key={range.id} value={range.id}>{range.name}</option>
                    ))}
                  </select>
                </div>
                <TimelineChart height={250} />
              </motion.div>

              {/* State Comparison */}
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-semibold text-gati-text mb-4">State-wise Coverage Comparison</h2>
                <StateComparisonChart height={280} />
              </motion.div>

              {/* Age Distribution */}
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-semibold text-gati-text mb-4">Enrollment by Age Group</h2>
                <AgeDistributionChart height={250} />
              </motion.div>
            </div>

            {/* AI Recommendations */}
            <div className="space-y-6">
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-gati-accent" />
                  <h2 className="font-semibold text-gati-text">AI Policy Recommendations</h2>
                </div>
                <p className="text-sm text-gati-muted mb-4">
                  AI-generated summaries based on data analysis
                </p>
                
                <div className="space-y-4">
                  {aiRecommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gati-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm text-gati-text">{rec.title}</h3>
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${rec.status === 'new' ? 'bg-blue-100 text-blue-700' : ''}
                          ${rec.status === 'reviewed' ? 'bg-amber-100 text-amber-700' : ''}
                          ${rec.status === 'implemented' ? 'bg-emerald-100 text-emerald-700' : ''}
                        `}>
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-xs text-gati-muted mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gati-muted">Confidence:</span>
                          <span className="text-xs font-medium text-gati-primary">{rec.confidence}%</span>
                        </div>
                        <span className={`
                          text-xs font-medium
                          ${rec.impact === 'High' ? 'text-red-600' : 'text-amber-600'}
                        `}>
                          {rec.impact} Impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Risk Distribution */}
              <motion.div 
                className="gati-panel p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-semibold text-gati-text mb-4">Risk Distribution</h2>
                <RiskDistributionChart height={200} />
              </motion.div>
            </div>
          </div>

          {/* Report Templates */}
          <motion.div 
            className="gati-panel overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gati-text">Report Templates</h2>
                <div className="flex items-center gap-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedReportType(type.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        selectedReportType === type.id
                          ? 'bg-gati-primary text-white'
                          : 'bg-gray-100 text-gati-muted hover:bg-gray-200'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredReports.map((report) => (
                <motion.div
                  key={report.id}
                  className="p-4 border border-gray-100 rounded-xl hover:border-gati-accent/30 hover:shadow-md transition-all"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${report.type === 'coverage' ? 'bg-blue-100' : ''}
                      ${report.type === 'performance' ? 'bg-purple-100' : ''}
                      ${report.type === 'risk' ? 'bg-amber-100' : ''}
                      ${report.type === 'field' ? 'bg-emerald-100' : ''}
                    `}>
                      {report.type === 'coverage' && <MapPin className="w-5 h-5 text-blue-600" />}
                      {report.type === 'performance' && <TrendingUp className="w-5 h-5 text-purple-600" />}
                      {report.type === 'risk' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                      {report.type === 'field' && <Users className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gati-text text-sm">{report.name}</h3>
                      <p className="text-xs text-gati-muted">{report.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gati-muted">
                      Last: {formatDateTime(report.lastGenerated)}
                    </span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded
                      ${report.schedule === 'daily' ? 'bg-blue-50 text-blue-600' : ''}
                      ${report.schedule === 'weekly' ? 'bg-purple-50 text-purple-600' : ''}
                      ${report.schedule === 'monthly' ? 'bg-amber-50 text-amber-600' : ''}
                      ${report.schedule === 'on-demand' ? 'bg-gray-100 text-gray-600' : ''}
                    `}>
                      {report.schedule}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      className="flex-1 gati-btn-primary text-xs py-2 flex items-center justify-center gap-1"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={generatingReport === report.id}
                    >
                      {generatingReport === report.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Cpu className="w-3 h-3" />
                          Generate
                        </>
                      )}
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download PDF">
                      <File className="w-4 h-4 text-red-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download CSV">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share">
                      <Share2 className="w-4 h-4 text-gati-muted" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Export Options */}
          <motion.div 
            className="gati-panel p-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gati-text mb-1">Quick Export</h2>
                <p className="text-sm text-gati-muted">Download consolidated reports for UIDAI, State Governments</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="gati-btn-secondary flex items-center gap-2">
                  <File className="w-4 h-4 text-red-500" />
                  Export PDF
                </button>
                <button className="gati-btn-secondary flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Export CSV
                </button>
                <button className="gati-btn-primary flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Full Analytics Export
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
