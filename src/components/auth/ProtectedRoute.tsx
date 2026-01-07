'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/analytics',
  '/intelligence',
  '/audit',
  '/field-operations',
  '/digital-twin',
  '/verification'
]

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showContent, setShowContent] = useState(false)

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  useEffect(() => {
    if (!isLoading) {
      if (isProtectedRoute && !isAuthenticated) {
        // Redirect to login with return URL
        router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
      } else {
        setShowContent(true)
      }
    }
  }, [isAuthenticated, isLoading, isProtectedRoute, pathname, router])

  // Show loading state
  if (isLoading || (isProtectedRoute && !showContent)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gati-white via-gati-gray-light to-gati-gray flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gati-saffron to-gati-green rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-2 border-4 border-transparent border-t-gati-saffron border-r-gati-green rounded-full"
            />
          </div>
          <h2 className="text-xl font-bold text-gati-blue mb-2">Verifying Access</h2>
          <p className="text-gati-gray-dark flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking authentication...
          </p>
        </motion.div>
      </div>
    )
  }

  // Show access denied for protected routes without auth
  if (isProtectedRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gati-white via-gati-gray-light to-gati-gray flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gati-gray"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gati-blue mb-2">Access Denied</h2>
          <p className="text-gati-gray-dark mb-6">
            You need to be logged in to access this page.
          </p>
          <button
            onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)}
            className="w-full py-3 bg-gradient-to-r from-gati-saffron to-gati-green text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
