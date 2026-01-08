'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <WifiOff className="w-12 h-12 text-gray-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. 
          Some features may be limited until you're back online.
        </p>

        {/* Available offline features */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">Available Offline:</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Previously viewed pages
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Cached dashboard data
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Saved reports and exports
            </li>
          </ul>

          <h2 className="font-semibold text-gray-900 mt-4 mb-3">Requires Connection:</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              AI Intelligence features
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Real-time analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Authentication
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gati-primary text-white rounded-lg hover:bg-gati-primary/90 transition-colors shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 shadow-md"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Status indicator */}
        <div className="mt-8 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Waiting for connection...
          </span>
        </div>
      </motion.div>
    </div>
  )
}
