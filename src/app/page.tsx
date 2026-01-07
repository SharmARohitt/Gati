'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Shield, 
  Brain, 
  MapPin, 
  Users, 
  BarChart3, 
  Lock,
  ChevronDown,
  Fingerprint,
  Database,
  Zap,
  Globe
} from 'lucide-react'
import { 
  AnimatedCounter, 
  PulsingDot, 
  AnimatedGrid, 
  FloatingParticles,
  Footer,
  HeroStat,
  PulseStat,
  IndiaMap
} from '@/components/ui'
import { pulseStripData } from '@/lib/data'

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gati-primary to-gati-secondary flex items-center justify-center shadow-gati">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-gati-primary text-xl">GATI</h1>
              <p className="text-[10px] text-gati-muted">Governance & Aadhaar Tracking Intelligence</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/admin" className="text-sm font-medium text-gati-muted hover:text-gati-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/analytics" className="text-sm font-medium text-gati-muted hover:text-gati-primary transition-colors">
              Analytics & Reports
            </Link>
            <Link href="/digital-twin" className="text-sm font-medium text-gati-muted hover:text-gati-primary transition-colors">
              India Digital Twin
            </Link>
            <Link href="/intelligence" className="text-sm font-medium text-gati-muted hover:text-gati-primary transition-colors">
              AI Intelligence
            </Link>
            <Link href="/admin" className="gati-btn-primary text-sm">
              Enter Console
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background effects */}
        <AnimatedGrid />
        <FloatingParticles />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(72,202,228,0.12)_0%,transparent_60%)]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-100 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PulsingDot color="bg-emerald-500" />
                <span className="text-sm font-medium text-gati-text">India's Digital Nervous System</span>
              </motion.div>
              
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
                <span className="text-gati-primary">GATI</span>
                <br />
                <span className="text-gradient">India's Identity</span>
                <br />
                <span className="text-gati-text">Mission Control</span>
              </h1>
              
              {/* Subheading */}
              <p className="text-xl text-gati-muted leading-relaxed mb-8 max-w-xl">
                A national AI-driven system that transforms Aadhaar data into{' '}
                <span className="text-gati-primary font-semibold">predictive governance</span>,{' '}
                <span className="text-gati-primary font-semibold">field action</span>, and{' '}
                <span className="text-gati-primary font-semibold">citizen impact</span>.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/admin" className="gati-btn-primary inline-flex items-center gap-2 text-lg">
                  Enter Admin Console
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/digital-twin" className="gati-btn-secondary inline-flex items-center gap-2 text-lg">
                  Explore India's Identity Pulse
                  <MapPin className="w-5 h-5" />
                </Link>
              </div>
              
              {/* Trust badges */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gati-muted">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Government Grade Security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gati-muted">
                  <Lock className="w-4 h-4 text-gati-accent" />
                  <span>Anonymised Data Only</span>
                </div>
              </div>
            </motion.div>
            
            {/* Right: India Map Preview */}
            <motion.div
              className="relative h-[500px] lg:h-[600px]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <IndiaMap mode="political" interactive={true} showLabels={true} />
              </div>
              
              {/* Floating stat cards */}
              <motion.div 
                className="absolute -left-4 top-20 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gati-text">1.38B+</p>
                    <p className="text-xs text-gati-muted">Aadhaar Enrolments</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -right-4 bottom-32 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gati-text">97.2%</p>
                    <p className="text-xs text-gati-muted">National Coverage</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-gati-muted" />
        </motion.div>
      </section>

      {/* Live Pulse Strip */}
      <section className="relative py-6 bg-gradient-to-r from-gati-primary via-gati-secondary to-gati-accent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 text-white shrink-0">
              <PulsingDot color="bg-white" />
              <span className="text-sm font-semibold uppercase tracking-wide">Live Identity Pulse</span>
            </div>
            <div className="flex items-center gap-4">
              <PulseStat label="Coverage" value={pulseStripData.aadhaarCoverage} suffix="%" />
              <PulseStat label="Freshness Index" value={pulseStripData.updateFreshness} suffix="%" />
              <PulseStat label="Biometric Compliance" value={pulseStripData.biometricCompliance} suffix="%" />
              <PulseStat label="High-Risk Regions" value={pulseStripData.highRiskRegions} status="warning" />
              <PulseStat label="Active Operations" value={pulseStripData.activeOperations} />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gati-primary mb-4">
              Platform Capabilities
            </h2>
            <p className="text-xl text-gati-muted max-w-2xl mx-auto">
              Comprehensive intelligence and governance tools for India's identity ecosystem
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gati-light/30 to-gati-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-gati-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">India 3D Digital Twin</h3>
              <p className="text-gati-muted leading-relaxed">
                Interactive 3D visualization of India's identity landscape. Zoom from national to PIN-code level with real-time data overlays.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">AI & ML Intelligence</h3>
              <p className="text-gati-muted leading-relaxed">
                Predictive analytics for enrolment trends, anomaly detection, and lifecycle intelligence. AI that thinks like a governance brain.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">Admin Command Center</h3>
              <p className="text-gati-muted leading-relaxed">
                Comprehensive dashboard for UIDAI admins. Manage issues, assign tasks, and track field operations in real-time.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">Verification Console</h3>
              <p className="text-gati-muted leading-relaxed">
                Pattern-based identity verification using aggregated, anonymised data. Flags risk signals for official field verification.
              </p>
            </motion.div>
            
            {/* Feature 5 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">Field Operations</h3>
              <p className="text-gati-muted leading-relaxed">
                Live tracking of field officers, task management, and performance metrics. Turn governance decisions into ground action.
              </p>
            </motion.div>
            
            {/* Feature 6 */}
            <motion.div
              className="gati-panel p-8 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gati-text mb-3">Blockchain Audit</h3>
              <p className="text-gati-muted leading-relaxed">
                Immutable audit trail with cryptographic verification. Every governance action is timestamped and tamper-proof.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gati-primary mb-4">
              India's Identity at a Glance
            </h2>
            <p className="text-xl text-gati-muted">
              Real-time metrics from the world's largest digital identity system
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="gati-panel-glow p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <HeroStat 
                label="Total Enrolments" 
                value={1389000000} 
                description="Unique Aadhaar holders"
              />
            </motion.div>
            <motion.div
              className="gati-panel-glow p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <HeroStat 
                label="National Coverage" 
                value={97.2} 
                suffix="%"
                description="Of eligible population"
              />
            </motion.div>
            <motion.div
              className="gati-panel-glow p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <HeroStat 
                label="Monthly Updates" 
                value={28500000} 
                description="Demographic & biometric"
              />
            </motion.div>
            <motion.div
              className="gati-panel-glow p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <HeroStat 
                label="States & UTs" 
                value={36} 
                description="Complete integration"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-24 bg-gati-primary text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Government-Grade Security
              </h2>
              <p className="text-xl text-gati-light/80 leading-relaxed mb-8">
                GATI is built with the highest standards of data protection and privacy. 
                All analyses operate on aggregated, anonymised datasets only.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-gati-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">End-to-End Encryption</h3>
                    <p className="text-gati-light/70">All data transmissions are encrypted with government-approved protocols</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-gati-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Role-Based Access Control</h3>
                    <p className="text-gati-light/70">Strict access controls ensure data visibility based on authorization level</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-gati-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Anonymised Analytics</h3>
                    <p className="text-gati-light/70">No personal Aadhaar data is stored or processed. Only aggregated patterns.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* Security illustration */}
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-gati-accent/20 to-transparent rounded-full animate-pulse-slow" />
                <div className="absolute inset-8 bg-gradient-to-br from-gati-light/20 to-transparent rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-16 bg-gradient-to-br from-white/20 to-transparent rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Shield className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <AnimatedGrid />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gati-primary mb-6">
              Ready to Transform Governance?
            </h2>
            <p className="text-xl text-gati-muted mb-10 max-w-2xl mx-auto">
              Access India's most comprehensive identity intelligence platform. 
              Make data-driven decisions that impact millions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/admin" className="gati-btn-primary inline-flex items-center gap-2 text-lg px-8">
                Enter Admin Console
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/digital-twin" className="gati-btn-secondary inline-flex items-center gap-2 text-lg px-8">
                Explore Digital Twin
                <Globe className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
