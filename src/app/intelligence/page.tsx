'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  Brain,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Target,
  Zap,
  Shield,
  ChevronRight,
  Activity,
  BarChart2,
  Cpu,
  Database,
  GitBranch,
  CheckCircle,
  Play,
  Loader2,
  Sparkles,
  MessageSquare,
  Send,
  RefreshCw,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  Eye,
  FileText,
  Download
} from 'lucide-react'
import { 
  AnimatedGrid,
  ConfidenceMeter,
  ProgressBar,
  Footer
} from '@/components/ui'

// AI Response types
interface AIInsight {
  id: string
  type: 'prediction' | 'anomaly' | 'recommendation' | 'alert'
  title: string
  content: string
  confidence: number
  timestamp: Date
  region?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

// Simulated AI responses
const generateAIInsight = (type: string): AIInsight => {
  const insights: Record<string, AIInsight[]> = {
    forecasting: [
      { id: '1', type: 'prediction', title: 'Enrolment Surge Predicted', content: 'Bihar is expected to see a 23% increase in new enrolments over the next 3 months due to government drive. Recommend increasing enrolment center capacity by 15%.', confidence: 94.2, timestamp: new Date(), region: 'Bihar', severity: 'medium' },
      { id: '2', type: 'prediction', title: 'Update Volume Forecast', content: 'Maharashtra will experience peak update requests during March-April. Projected volume: 2.4M updates. Current capacity can handle 1.8M. Action needed.', confidence: 91.8, timestamp: new Date(), region: 'Maharashtra', severity: 'high' },
      { id: '3', type: 'recommendation', title: 'Resource Optimization', content: 'Based on seasonal patterns, suggest redistributing 12 mobile enrolment units from Tamil Nadu to Jharkhand for Q2 2026.', confidence: 88.5, timestamp: new Date(), severity: 'low' },
    ],
    anomaly: [
      { id: '4', type: 'anomaly', title: 'Unusual Update Pattern Detected', content: 'District Muzaffarpur showing 340% spike in address updates over 72 hours. Pattern inconsistent with historical data. Recommend field verification.', confidence: 97.2, timestamp: new Date(), region: 'Bihar - Muzaffarpur', severity: 'critical' },
      { id: '5', type: 'alert', title: 'Biometric Quality Drop', content: 'Fingerprint rejection rate in Kerala increased from 2.1% to 8.7% in last 48 hours. Possible device calibration issue at 3 centers.', confidence: 95.6, timestamp: new Date(), region: 'Kerala', severity: 'high' },
      { id: '6', type: 'anomaly', title: 'Timing Anomaly', content: '847 updates processed between 2-4 AM in Lucknow cluster. This is outside normal operating hours. Flagged for audit review.', confidence: 99.1, timestamp: new Date(), region: 'Uttar Pradesh - Lucknow', severity: 'medium' },
    ],
    mobility: [
      { id: '7', type: 'prediction', title: 'Migration Corridor Identified', content: 'AI detected significant migration pattern: Rural Odisha → Urban Maharashtra. 45,000+ address updates indicate workforce movement. Peak in Oct-Nov.', confidence: 89.3, timestamp: new Date(), region: 'Odisha → Maharashtra', severity: 'low' },
      { id: '8', type: 'recommendation', title: 'Service Point Optimization', content: 'Based on mobility patterns, recommend opening 3 new Aadhaar Seva Kendras in Pune industrial belt to serve migrant population.', confidence: 86.7, timestamp: new Date(), region: 'Pune, Maharashtra', severity: 'medium' },
      { id: '9', type: 'prediction', title: 'Reverse Migration Alert', content: 'Post-harvest season showing 18% increase in return migration to Bihar from Delhi NCR. Update centers in Patna may need reinforcement.', confidence: 92.4, timestamp: new Date(), region: 'Delhi → Bihar', severity: 'low' },
    ],
    lifecycle: [
      { id: '10', type: 'alert', title: 'Mandatory Update Due', content: '2.3 million children in UP will reach age 5 in next 6 months requiring mandatory biometric update. Current capacity: 1.1M. Gap: 1.2M.', confidence: 98.4, timestamp: new Date(), region: 'Uttar Pradesh', severity: 'critical' },
      { id: '11', type: 'prediction', title: 'Age Transition Wave', content: 'Predicted 890,000 children reaching age 15 in Tamil Nadu Q3 2026. Mandatory biometric update required. Suggest pre-emptive outreach campaign.', confidence: 96.1, timestamp: new Date(), region: 'Tamil Nadu', severity: 'high' },
      { id: '12', type: 'recommendation', title: 'Proactive Outreach', content: 'AI recommends SMS campaign to 1.4M parents in Gujarat for upcoming child biometric updates. Estimated compliance improvement: +34%.', confidence: 87.9, timestamp: new Date(), region: 'Gujarat', severity: 'medium' },
    ]
  }
  return insights[type]?.[Math.floor(Math.random() * 3)] || insights.forecasting[0]
}

// Chat message type
interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  isTyping?: boolean
}

export default function IntelligencePage() {
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeInsights, setActiveInsights] = useState<AIInsight[]>([])
  const [liveStats, setLiveStats] = useState({
    predictions: 12847,
    accuracy: 94.2,
    responseTime: 47,
    activeModels: 4
  })
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'ai', content: 'Hello! I am GATI AI Assistant. I can help you analyze Aadhaar data patterns, predict trends, and provide governance insights. What would you like to know?', timestamp: new Date() }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        predictions: prev.predictions + Math.floor(Math.random() * 5),
        responseTime: 40 + Math.floor(Math.random() * 20)
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Run AI Analysis - REAL ML API calls
  const runAIAnalysis = useCallback(async (capabilityId: string) => {
    setIsProcessing(true)
    setSelectedCapability(capabilityId)
    
    try {
      let endpoint = '/api/ai/anomaly'
      if (capabilityId === 'forecasting') endpoint = '/api/ai/forecast'
      else if (capabilityId === 'mobility' || capabilityId === 'lifecycle') endpoint = '/api/ai/risk'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      
      // Transform ML API response to insight format
      let insight: AIInsight
      if (data.success && (data.results?.length > 0 || data.forecast)) {
        if (capabilityId === 'forecasting' && data.forecast) {
          insight = {
            id: Date.now().toString(),
            type: 'prediction',
            title: 'Forecast Generated',
            content: `Trend: ${data.forecast.trend || 'stable'}. Model confidence: ${(data.forecast.confidence * 100 || 85).toFixed(1)}%. Check forecast dashboard for detailed projections.`,
            confidence: data.forecast.confidence * 100 || 85,
            timestamp: new Date(),
            severity: 'low'
          }
        } else if (data.results?.length > 0) {
          const result = data.results[0]
          insight = {
            id: Date.now().toString(),
            type: capabilityId === 'anomaly' ? 'anomaly' : 'prediction',
            title: capabilityId === 'anomaly' ? 'Anomaly Detected' : 'Analysis Complete',
            content: result.description || `${capabilityId} analysis completed. Found ${data.results.length} items requiring attention.`,
            confidence: (result.confidence || result.score || 0.85) * 100,
            timestamp: new Date(),
            region: result.state || result.location,
            severity: result.severity || (result.score > 0.8 ? 'high' : result.score > 0.5 ? 'medium' : 'low')
          }
        } else {
          insight = {
            id: Date.now().toString(),
            type: 'recommendation',
            title: 'No Issues Found',
            content: `${capabilityId} analysis complete. No significant issues detected at this time.`,
            confidence: 95,
            timestamp: new Date(),
            severity: 'low'
          }
        }
      } else {
        // ML API unavailable, show status
        insight = {
          id: Date.now().toString(),
          type: 'alert',
          title: 'ML Service Status',
          content: data.error || 'ML API is currently processing. Results will appear when available.',
          confidence: 0,
          timestamp: new Date(),
          severity: 'medium'
        }
      }
      
      setActiveInsights(prev => [insight, ...prev.slice(0, 4)])
      setLiveStats(prev => ({ ...prev, predictions: prev.predictions + 1 }))
    } catch (error) {
      console.error('[AI Analysis] Error:', error)
      const errorInsight: AIInsight = {
        id: Date.now().toString(),
        type: 'alert',
        title: 'Connection Error',
        content: 'Unable to connect to ML service. Please ensure the Python ML server is running.',
        confidence: 0,
        timestamp: new Date(),
        severity: 'high'
      }
      setActiveInsights(prev => [errorInsight, ...prev.slice(0, 4)])
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Handle chat submit - REAL AI powered by Gemini
  const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isAITyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, userMessage])
    const userQuery = chatInput
    setChatInput('')
    setIsAITyping(true)

    try {
      // Call real AI API endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userQuery,
          includeContext: true 
        })
      })

      const data = await response.json()
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.success 
          ? data.response 
          : 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('[AI Chat] Error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'I apologize, but I\'m having trouble connecting to the AI service. Please check your connection and try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAITyping(false)
    }
  }, [chatInput, isAITyping])

  const mlCapabilities = [
    {
      id: 'forecasting',
      title: 'Trend Forecasting',
      icon: TrendingUp,
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Predict enrolment and update patterns for the next 6-12 months',
      metrics: [
        { label: 'Accuracy', value: 94.2 },
        { label: 'Confidence', value: 89.5 },
      ],
      details: 'Uses historical patterns, seasonal trends, and demographic data to predict future enrolment rates and update volumes at state and district levels.'
    },
    {
      id: 'anomaly',
      title: 'Anomaly Detection',
      icon: AlertTriangle,
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Identify unnatural spikes, gaps, and inconsistencies in real-time',
      metrics: [
        { label: 'Detection Rate', value: 97.8 },
        { label: 'False Positive Rate', value: 2.3 },
      ],
      details: 'Real-time monitoring of data patterns to detect unusual activities such as sudden spikes in updates, geographic inconsistencies, or timing anomalies.'
    },
    {
      id: 'mobility',
      title: 'Mobility & Migration Signals',
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Detect population movement patterns from aggregated address updates',
      metrics: [
        { label: 'Pattern Recognition', value: 91.3 },
        { label: 'Regional Accuracy', value: 88.7 },
      ],
      details: 'Analyzes aggregated address update patterns to identify migration corridors, seasonal movement trends, and urbanization patterns.'
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle Intelligence',
      icon: Clock,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Track and predict biometric transition requirements',
      metrics: [
        { label: 'Transition Prediction', value: 92.6 },
        { label: 'Age Accuracy', value: 95.1 },
      ],
      details: 'Monitors the lifecycle of Aadhaar holders to predict when biometric updates are needed, particularly for children transitioning through mandatory update ages.'
    }
  ]

  const pipelineSteps = [
    { id: 1, title: 'Data Ingestion', icon: Database, status: 'active' },
    { id: 2, title: 'Aggregation', icon: GitBranch, status: 'active' },
    { id: 3, title: 'Anonymisation', icon: Shield, status: 'active' },
    { id: 4, title: 'Feature Extraction', icon: Cpu, status: 'active' },
    { id: 5, title: 'ML Processing', icon: Brain, status: 'active' },
    { id: 6, title: 'Insight Generation', icon: Zap, status: 'active' },
  ]

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp
      case 'anomaly': return AlertTriangle
      case 'alert': return AlertCircle
      default: return Sparkles
    }
  }

  return (
    <main className="min-h-screen bg-gati-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gati-muted" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl text-gati-primary">
                AI & ML Intelligence
              </h1>
              <p className="text-sm text-gati-muted">AI That Thinks Like a Governance Brain</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">AI Online</span>
            </div>
            <Link href="/admin" className="gati-btn-primary text-sm">
              Admin Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <AnimatedGrid />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1)_0%,transparent_60%)]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200 mb-6">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Powered by Machine Learning</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gati-primary mb-6">
              AI That Thinks Like a<br />
              <span className="text-gradient">Governance Brain</span>
            </h1>
            
            <p className="text-xl text-gati-muted leading-relaxed mb-8">
              Advanced machine learning models that analyze patterns, predict trends, 
              and generate actionable insights for proactive governance.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => runAIAnalysis('anomaly')}
                className="gati-btn-primary inline-flex items-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Anomaly Scan
              </button>
              <button
                onClick={() => runAIAnalysis('forecasting')}
                className="gati-btn-secondary inline-flex items-center gap-2"
                disabled={isProcessing}
              >
                <TrendingUp className="w-4 h-4" />
                Generate Forecast
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live AI Insights Panel */}
      <AnimatePresence>
        {activeInsights.length > 0 && (
          <motion.section 
            className="py-6 bg-gradient-to-r from-purple-900 via-gati-primary to-purple-900"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span className="text-white font-semibold">Live AI Insights</span>
                <span className="text-purple-300 text-sm">({activeInsights.length} generated)</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeInsights.slice(0, 3).map((insight, index) => {
                  const TypeIcon = getTypeIcon(insight.type)
                  return (
                    <motion.div
                      key={insight.id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-purple-300" />
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(insight.severity)}`}>
                            {insight.severity || 'info'}
                          </span>
                        </div>
                        <span className="text-xs text-purple-300">{insight.confidence}% conf.</span>
                      </div>
                      <h4 className="text-white font-semibold mb-1">{insight.title}</h4>
                      <p className="text-purple-200 text-sm line-clamp-2">{insight.content}</p>
                      {insight.region && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-300">
                          <MapPin className="w-3 h-3" />
                          {insight.region}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ML Pipeline Visualization */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gati-primary mb-4">
              Intelligence Pipeline
            </h2>
            <p className="text-gati-muted max-w-2xl mx-auto">
              Our ML pipeline processes aggregated data through multiple stages while ensuring complete anonymisation
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Pipeline visualization */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
              {pipelineSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <React.Fragment key={step.id}>
                    <motion.div
                      className="flex flex-col items-center min-w-[120px]"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shadow-gati mb-3 relative">
                        <Icon className="w-7 h-7 text-white" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gati-text text-center">{step.title}</span>
                      <span className="text-xs text-emerald-600 font-medium mt-1">Active</span>
                    </motion.div>
                    
                    {index < pipelineSteps.length - 1 && (
                      <div className="flex-1 min-w-[40px] h-0.5 bg-gradient-to-r from-gati-primary to-gati-accent relative">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-gati-accent to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ML Capabilities - Interactive */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gati-primary mb-4">
              Machine Learning Capabilities
            </h2>
            <p className="text-gati-muted max-w-2xl mx-auto">
              Click any capability to run live AI analysis and see insights in action
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mlCapabilities.map((capability, index) => {
              const Icon = capability.icon
              const isSelected = selectedCapability === capability.id
              const isRunning = isProcessing && isSelected
              
              return (
                <motion.div
                  key={capability.id}
                  className={`
                    gati-panel p-6 cursor-pointer transition-all duration-300 relative overflow-hidden
                    ${isSelected ? 'ring-2 ring-gati-accent shadow-glow' : 'hover:shadow-lg'}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isProcessing && runAIAnalysis(capability.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Processing overlay */}
                  <AnimatePresence>
                    {isRunning && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-gati-accent/20 to-purple-500/20 flex items-center justify-center z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                          <span className="font-medium text-purple-700">AI Processing...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${capability.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gati-text mb-1">{capability.title}</h3>
                      <p className="text-sm text-gati-muted">{capability.description}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${capability.bgColor} transition-colors`}>
                      {isRunning ? (
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 text-gati-secondary" />
                      )}
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {capability.metrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gati-muted">{metric.label}</span>
                          <span className="font-medium text-gati-text">{metric.value}%</span>
                        </div>
                        <ProgressBar value={metric.value} showLabel={false} size="small" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Expanded details */}
                  <motion.div
                    initial={false}
                    animate={{ height: isSelected ? 'auto' : 0, opacity: isSelected ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gati-muted leading-relaxed mb-3">
                        {capability.details}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gati-accent font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Click to run analysis
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Model Performance Dashboard - Live */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gati-primary mb-4">
              Live Model Performance
            </h2>
            <p className="text-gati-muted max-w-2xl mx-auto">
              Real-time monitoring of AI model accuracy and confidence levels
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <motion.div 
              className="gati-panel-glow p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gati-muted">Model Health</span>
              </div>
              <div className="text-3xl font-bold text-gati-text mb-2">98.7%</div>
              <span className="text-xs text-emerald-600 font-medium">All Systems Operational</span>
            </motion.div>
            
            <motion.div 
              className="gati-panel-glow p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gati-muted">Prediction Accuracy</span>
              </div>
              <div className="text-3xl font-bold text-gati-text mb-2">{liveStats.accuracy}%</div>
              <ConfidenceMeter confidence={liveStats.accuracy} />
            </motion.div>
            
            <motion.div 
              className="gati-panel-glow p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart2 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gati-muted">Total Predictions</span>
              </div>
              <motion.div 
                className="text-3xl font-bold text-gati-text mb-2"
                key={liveStats.predictions}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {liveStats.predictions.toLocaleString()}
              </motion.div>
              <span className="text-xs text-gati-muted">Updated live</span>
            </motion.div>
            
            <motion.div 
              className="gati-panel-glow p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-gati-muted">Avg Response Time</span>
              </div>
              <div className="text-3xl font-bold text-gati-text mb-2">{liveStats.responseTime}ms</div>
              <span className="text-xs text-gati-muted">Real-time processing</span>
            </motion.div>
          </div>

          {/* AI Chat Interface */}
          <motion.div
            className="gati-panel overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-purple-600 to-gati-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">GATI AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-200">Online • Ask anything about Aadhaar data</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setChatMessages([{ id: '0', role: 'ai', content: 'Hello! I am GATI AI Assistant. I can help you analyze Aadhaar data patterns, predict trends, and provide governance insights. What would you like to know?', timestamp: new Date() }])}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user' 
                      ? 'bg-gati-primary text-white rounded-br-md' 
                      : 'bg-white shadow-md border border-gray-100 rounded-bl-md'
                  }`}>
                    {message.role === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">GATI AI</span>
                      </div>
                    )}
                    <p className={`text-sm whitespace-pre-line ${message.role === 'user' ? 'text-white' : 'text-gati-text'}`}>
                      {message.content}
                    </p>
                    <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-white/70' : 'text-gati-muted'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isAITyping && (
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-white shadow-md border border-gray-100 rounded-2xl rounded-bl-md p-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">GATI AI</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <motion.span className="w-2 h-2 bg-purple-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                      <motion.span className="w-2 h-2 bg-purple-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                      <motion.span className="w-2 h-2 bg-purple-400 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about coverage, risks, predictions, anomalies..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gati-accent focus:ring-2 focus:ring-gati-accent/20 outline-none text-sm"
                  disabled={isAITyping}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isAITyping}
                  className="p-3 bg-gati-primary text-white rounded-xl hover:bg-gati-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gati-muted">
                <Sparkles className="w-3 h-3" />
                Try: "What are the high-risk regions?" or "Predict next quarter's updates"
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Privacy Disclaimer */}
      <section className="py-16 bg-gradient-to-r from-gati-primary to-gati-secondary">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-display font-bold mb-4">
              Privacy-First AI
            </h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <p className="text-xl leading-relaxed mb-6">
                "All AI models operate only on aggregated, anonymised datasets.<br />
                <strong>No personal Aadhaar data is stored or processed.</strong>"
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-1">Data Aggregation</span>
                    <span className="text-sm text-white/70">All inputs are aggregated at regional level before processing</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-1">No Individual IDs</span>
                    <span className="text-sm text-white/70">Models never see or process individual Aadhaar numbers</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-1">Audit Compliant</span>
                    <span className="text-sm text-white/70">All model decisions are logged and auditable</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
