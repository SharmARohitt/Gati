'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ArrowRight,
  Fingerprint,
  Building2
} from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/admin'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(returnUrl)
    }
  }, [isAuthenticated, returnUrl, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      setIsSubmitting(false)
      return
    }

    const result = await login(username, password)
    
    if (result.success) {
      setLoginSuccess(true)
      setTimeout(() => {
        router.push(returnUrl)
      }, 1000)
    } else {
      setError(result.error || 'Login failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gati-blue via-gati-navy to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-20 w-32 h-32 bg-gati-saffron/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-20 w-40 h-40 bg-gati-green/10 rounded-full blur-3xl"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gati-saffron via-white to-gati-green rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-105 transition-transform">
                <Fingerprint className="w-10 h-10 text-gati-blue" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gati-green rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">GATI Admin</h1>
          <p className="text-gati-gray-light text-sm">
            Governance & Aadhaar Tracking Intelligence
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Government Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-gati-gray">
            <Building2 className="w-5 h-5 text-gati-blue" />
            <span className="text-sm font-medium text-gati-gray-dark">
              Official Government Portal
            </span>
          </div>

          {loginSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gati-blue mb-2">Login Successful!</h3>
              <p className="text-gati-gray-dark flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to dashboard...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-sm font-semibold text-gati-gray-dark mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gati-gray" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gati-gray rounded-xl focus:border-gati-blue focus:ring-4 focus:ring-gati-blue/10 transition-all outline-none text-gati-blue placeholder:text-gati-gray"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gati-gray-dark mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gati-gray" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gati-gray rounded-xl focus:border-gati-blue focus:ring-4 focus:ring-gati-blue/10 transition-all outline-none text-gati-blue placeholder:text-gati-gray"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gati-gray hover:text-gati-blue transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-gati-saffron via-gati-blue to-gati-green text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Demo Credentials */}
          {!loginSuccess && (
            <div className="mt-6 pt-6 border-t border-gati-gray">
              <div className="bg-gati-blue/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-gati-blue mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Demo Credentials
                </p>
                <div className="space-y-1 text-xs text-gati-gray-dark">
                  <p><span className="font-medium">Username:</span> admin</p>
                  <p><span className="font-medium">Password:</span> gati@2024</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-gati-gray-light text-xs">
            © 2024 GATI - Unique Identification Authority of India (UIDAI)
          </p>
          <p className="text-gati-gray text-xs mt-1">
            Authorized personnel only. All activities are monitored and logged.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
