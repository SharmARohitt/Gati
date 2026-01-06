'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  ShieldCheck,
  Search,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Brain,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Info,
  ChevronRight,
  Download
} from 'lucide-react'
import { 
  AnimatedGrid,
  ConfidenceMeter,
  ProgressBar,
  SeverityBadge,
  Footer
} from '@/components/ui'

type InvestigationType = 'pattern' | 'anomaly' | 'duplicate'

interface SearchResult {
  id: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  region: string
  patterns: string[]
  recommendation: string
  requiresFieldVerification: boolean
}

export default function VerificationPage() {
  const [investigationType, setInvestigationType] = useState<InvestigationType>('pattern')
  const [region, setRegion] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)

  const investigationTypes = [
    { 
      id: 'pattern' as const, 
      label: 'Pattern-Based Analysis', 
      icon: Activity,
      description: 'Analyze regional patterns and trends'
    },
    { 
      id: 'anomaly' as const, 
      label: 'Anomaly Correlation', 
      icon: AlertTriangle,
      description: 'Detect unusual data correlations'
    },
    { 
      id: 'duplicate' as const, 
      label: 'Duplicate-Risk Probability', 
      icon: FileText,
      description: 'AI-scored duplication risk assessment'
    }
  ]

  const handleSearch = async () => {
    setIsSearching(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSearchResults([
      {
        id: 'VRF-2025-001',
        riskScore: 78.5,
        riskLevel: 'high',
        region: region || 'Bihar - Kishanganj',
        patterns: [
          'Unusual update frequency detected in 3 adjacent blocks',
          'Age distribution anomaly in 18-25 demographic',
          'Address update patterns suggest possible data inconsistency'
        ],
        recommendation: 'Field verification recommended. Deploy mobile verification team.',
        requiresFieldVerification: true
      },
      {
        id: 'VRF-2025-002',
        riskScore: 45.2,
        riskLevel: 'medium',
        region: region || 'Bihar - Kishanganj',
        patterns: [
          'Moderate update backlog in biometric transitions',
          'Seasonal migration pattern identified'
        ],
        recommendation: 'Monitor for next 30 days. Schedule routine verification.',
        requiresFieldVerification: false
      },
      {
        id: 'VRF-2025-003',
        riskScore: 12.8,
        riskLevel: 'low',
        region: region || 'Bihar - Kishanganj',
        patterns: [
          'Normal enrolment patterns',
          'Consistent with regional averages'
        ],
        recommendation: 'No immediate action required.',
        requiresFieldVerification: false
      }
    ])
    setIsSearching(false)
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
                Identity Integrity & Verification Console
              </h1>
              <p className="text-sm text-gati-muted">Pattern-based verification using aggregated data</p>
            </div>
          </div>
          
          <Link href="/admin" className="gati-btn-secondary text-sm">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Important Disclaimer */}
          <motion.div 
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Important Disclaimer</h3>
                <p className="text-amber-800 leading-relaxed">
                  <strong>GATI does not identify individuals.</strong> It highlights risk signals based on 
                  aggregated, anonymised patterns that require official field verification. All analysis 
                  operates on statistical models without accessing personal Aadhaar data.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Search Panel */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="gati-panel p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gati-text mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gati-accent" />
                  Investigation Parameters
                </h2>

                {/* Investigation Type */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gati-text mb-3 block">
                    Investigation Approach
                  </label>
                  <div className="space-y-2">
                    {investigationTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setInvestigationType(type.id)}
                          className={`
                            w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left
                            ${investigationType === type.id 
                              ? 'border-gati-accent bg-gati-light/20' 
                              : 'border-gray-200 hover:border-gati-light'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${investigationType === type.id ? 'text-gati-accent' : 'text-gati-muted'}`} />
                          <div>
                            <span className={`font-medium block ${investigationType === type.id ? 'text-gati-primary' : 'text-gati-text'}`}>
                              {type.label}
                            </span>
                            <span className="text-xs text-gati-muted">{type.description}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Region Input */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gati-text mb-2 block">
                    Region (State/District)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
                    <input
                      type="text"
                      placeholder="e.g., Bihar - Kishanganj"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="gati-input pl-10"
                    />
                  </div>
                </div>

                {/* Age Range */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gati-text mb-2 block">
                    Approximate Age Range (Optional)
                  </label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="gati-select"
                  >
                    <option value="">All Ages</option>
                    <option value="0-5">0-5 Years</option>
                    <option value="5-17">5-17 Years</option>
                    <option value="18-30">18-30 Years</option>
                    <option value="30-45">30-45 Years</option>
                    <option value="45+">45+ Years</option>
                  </select>
                </div>

                {/* Reference ID */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gati-text mb-2 block">
                    Complaint/Reference ID (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gati-muted" />
                    <input
                      type="text"
                      placeholder="e.g., CMP-2025-001"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      className="gati-input pl-10"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <button 
                  onClick={handleSearch}
                  disabled={isSearching || !region}
                  className="w-full gati-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Analyzing Patterns...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>

                {/* Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gati-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-gati-muted">
                      Analysis uses aggregated regional data only. No individual records are accessed.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Results Panel */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Empty State */}
              {!searchResults && !isSearching && (
                <div className="gati-panel p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gati-muted" />
                  </div>
                  <h3 className="text-xl font-semibold text-gati-text mb-2">
                    Ready to Analyze
                  </h3>
                  <p className="text-gati-muted max-w-md mx-auto">
                    Enter investigation parameters and run analysis to identify potential 
                    risk signals in aggregated regional data.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="gati-panel p-12 text-center">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center mx-auto mb-6"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Brain className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gati-text mb-2">
                    AI Analysis in Progress
                  </h3>
                  <p className="text-gati-muted mb-6">
                    Scanning aggregated patterns and correlations...
                  </p>
                  <div className="max-w-xs mx-auto">
                    <ProgressBar value={75} color="bg-gati-accent" />
                  </div>
                </div>
              )}

              {/* Results */}
              {searchResults && !isSearching && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gati-text">
                      Analysis Results
                    </h2>
                    <span className="text-sm text-gati-muted">
                      {searchResults.length} risk signals identified
                    </span>
                  </div>

                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      className={`
                        gati-panel p-6 border-l-4
                        ${result.riskLevel === 'critical' ? 'border-l-purple-500' : ''}
                        ${result.riskLevel === 'high' ? 'border-l-red-500' : ''}
                        ${result.riskLevel === 'medium' ? 'border-l-amber-500' : ''}
                        ${result.riskLevel === 'low' ? 'border-l-emerald-500' : ''}
                      `}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-gati-muted">{result.id}</span>
                            <SeverityBadge severity={result.riskLevel} />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gati-muted">
                            <MapPin className="w-4 h-4" />
                            <span>{result.region}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gati-text mb-1">
                            {result.riskScore}%
                          </div>
                          <span className="text-xs text-gati-muted">Risk Score</span>
                        </div>
                      </div>

                      {/* Risk Meter */}
                      <div className="mb-4">
                        <ConfidenceMeter confidence={result.riskScore} />
                      </div>

                      {/* Patterns */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gati-text mb-2">Detected Patterns:</h4>
                        <ul className="space-y-1">
                          {result.patterns.map((pattern, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gati-muted">
                              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-gati-accent" />
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendation */}
                      <div className="p-3 bg-gray-50 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gati-text">AI Recommendation</span>
                        </div>
                        <p className="text-sm text-gati-muted">{result.recommendation}</p>
                      </div>

                      {/* Field Verification Tag */}
                      {result.requiresFieldVerification && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">
                            Requires Field Verification
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button className="gati-btn-secondary text-sm flex-1">
                          Schedule Verification
                        </button>
                        <button className="gati-btn-ghost text-sm flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Final Disclaimer */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        These results are based on aggregated pattern analysis and do not constitute 
                        identification of any individual. All flagged signals require official field 
                        verification before any action is taken.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
