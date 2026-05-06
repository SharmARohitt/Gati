'use client';

/**
 * GATI Login Page — Firebase Auth
 * Email/Password + Google Sign-In
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Mail, Eye, EyeOff, AlertCircle,
  ArrowRight, Fingerprint, CheckCircle, Loader2, Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderWrapper';

export const dynamic = 'force-dynamic'

// Inner component that uses useSearchParams (must be inside Suspense)
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/admin';
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(returnUrl);
    }
  }, [isAuthenticated, isLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsSubmitting(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      setLoginSuccess(true);
      setTimeout(() => router.replace(returnUrl), 800);
    } else {
      setError(result.error || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.success) {
      setLoginSuccess(true);
      setTimeout(() => router.replace(returnUrl), 800);
    } else {
      setError(result.error || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // Success state
  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Granted</h2>
          <p className="text-gray-500 text-sm">Redirecting to command center...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#1E5AA8]" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A2463] via-[#1E5AA8] to-[#00B4D8] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        {/* Glow orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#00B4D8]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#0A2463]/40 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-xl tracking-tight">GATI</h1>
              <p className="text-xs text-white/60">Governance & Aadhaar Tracking</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {/* Ashoka Chakra */}
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-[3px] border-white/40" />
              <div className="absolute inset-2 rounded-full border-2 border-white/30" />
              <div className="absolute w-4 h-4 rounded-full bg-white/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-[1.5px] h-[18px] bg-white/30 origin-bottom"
                  style={{ transform: `rotate(${i * 15}deg)`, bottom: '50%', left: 'calc(50% - 0.75px)' }}
                />
              ))}
            </div>

            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              India's Identity<br />Mission Control
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-sm">
              Secure access to real-time insights across 1.4 billion+ Aadhaar records with AI-powered governance intelligence.
            </p>

            <div className="space-y-3">
              {[
                { icon: Shield, text: 'Government-grade Security' },
                { icon: Fingerprint, text: 'Biometric Intelligence' },
                { icon: Sparkles, text: 'AI-Powered Analytics' },
              ].map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="text-white/40 text-xs relative z-10">© 2026 GATI Platform · Government of India Initiative</p>
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F0F4F8] p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <div className="text-left">
                <h1 className="font-bold text-[#0A2463] text-lg">GATI</h1>
                <p className="text-xs text-gray-400">Governance Platform</p>
              </div>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to access the GATI console</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all mb-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">or sign in with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/10 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1E5AA8] focus:ring-2 focus:ring-[#1E5AA8]/10 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#0A2463] to-[#1E5AA8] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-[#0d2d7a] hover:to-[#2468c0] transform hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected by Firebase Authentication</span>
              </div>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#1E5AA8] font-semibold hover:text-[#0A2463] transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </motion.div>

          <div className="mt-5 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-[#0A2463] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Outer component wraps with Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0A2463] to-[#1E5AA8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
