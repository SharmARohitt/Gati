'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
  CheckCircle
} from 'lucide-react'
import { 
  AnimatedGrid,
  ConfidenceMeter,
  ProgressBar,
  Footer
} from '@/components/ui'

export default function IntelligencePage() {
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)

  const mlCapabilities = [
    {
      id: 'forecasting',
      title: 'Trend Forecasting',
      icon: TrendingUp,
      color: 'from-emerald-400 to-emerald-600',
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
          
          <Link href="/admin" className="gati-btn-primary text-sm">
            Admin Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
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
            
            <p className="text-xl text-gati-muted leading-relaxed">
              Advanced machine learning models that analyze patterns, predict trends, 
              and generate actionable insights for proactive governance.
            </p>
          </motion.div>
        </div>
      </section>

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

      {/* ML Capabilities */}
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
              Four specialized AI modules working together to provide comprehensive intelligence
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mlCapabilities.map((capability, index) => {
              const Icon = capability.icon
              const isSelected = selectedCapability === capability.id
              
              return (
                <motion.div
                  key={capability.id}
                  className={`
                    gati-panel p-6 cursor-pointer transition-all duration-300
                    ${isSelected ? 'ring-2 ring-gati-accent shadow-glow' : ''}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedCapability(isSelected ? null : capability.id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${capability.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gati-text mb-1">{capability.title}</h3>
                      <p className="text-sm text-gati-muted">{capability.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gati-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
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
                      <p className="text-sm text-gati-muted leading-relaxed">
                        {capability.details}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Model Performance Dashboard */}
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
          
          <div className="grid md:grid-cols-4 gap-6">
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
              <div className="text-3xl font-bold text-gati-text mb-2">94.2%</div>
              <ConfidenceMeter confidence={94.2} />
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
                <span className="text-sm font-medium text-gati-muted">Daily Predictions</span>
              </div>
              <div className="text-3xl font-bold text-gati-text mb-2">12.4K</div>
              <span className="text-xs text-gati-muted">Last 24 hours</span>
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
              <div className="text-3xl font-bold text-gati-text mb-2">47ms</div>
              <span className="text-xs text-gati-muted">Real-time processing</span>
            </motion.div>
          </div>
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
