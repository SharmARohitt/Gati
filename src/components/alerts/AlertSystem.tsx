'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle, 
  X,
  Bell,
  BellRing
} from 'lucide-react'

// Alert types
export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'anomaly'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Alert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: Record<string, unknown>
}

interface AlertContextType {
  alerts: Alert[]
  unreadCount: number
  isConnected: boolean
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAlert: (id: string) => void
  clearAllAlerts: () => void
}

const AlertContext = createContext<AlertContextType | null>(null)

// Alert Provider Component
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate unique alert ID
  const generateId = () => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add new alert
  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    const newAlert: Alert = {
      ...alert,
      id: generateId(),
      timestamp: new Date(),
      read: false
    }
    
    setAlerts(prev => [newAlert, ...prev].slice(0, 100)) // Keep max 100 alerts
    
    // Play notification sound for high priority
    if (alert.priority === 'high' || alert.priority === 'critical') {
      playNotificationSound()
    }
  }, [])

  // Mark single alert as read
  const markAsRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }, [])

  // Mark all alerts as read
  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }, [])

  // Clear single alert
  const clearAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Unread count
  const unreadCount = alerts.filter(a => !a.read).length

  // Play notification sound
  const playNotificationSound = () => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        // Use a simple beep - you can replace with actual audio file
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.value = 0.1
        
        oscillator.start()
        setTimeout(() => oscillator.stop(), 150)
      } catch {
        // Audio not supported
      }
    }
  }

  // WebSocket connection for real-time alerts
  const connectWebSocket = useCallback(() => {
    // For production, connect to actual WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/alerts'
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('Alert WebSocket connected')
        setIsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'alert') {
            addAlert({
              type: data.alertType || 'info',
              priority: data.priority || 'medium',
              title: data.title,
              message: data.message,
              data: data.data
            })
          }
        } catch {
          console.error('Failed to parse WebSocket message')
        }
      }
      
      ws.onclose = () => {
        console.log('Alert WebSocket disconnected')
        setIsConnected(false)
        
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 5000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    } catch {
      // WebSocket connection failed - use polling fallback
      setIsConnected(false)
    }
  }, [addAlert])

  // Polling fallback for alerts (when WebSocket not available)
  useEffect(() => {
    // Try WebSocket first
    // connectWebSocket()
    
    // For demo: simulate some alerts
    const demoAlerts: Omit<Alert, 'id' | 'timestamp' | 'read'>[] = [
      {
        type: 'anomaly',
        priority: 'high',
        title: 'Anomaly Detected',
        message: 'Unusual biometric enrollment pattern detected in Maharashtra region'
      },
      {
        type: 'info',
        priority: 'low',
        title: 'ML Model Updated',
        message: 'Anomaly detection model retrained with latest data'
      }
    ]
    
    // Add demo alerts with delay
    demoAlerts.forEach((alert, index) => {
      setTimeout(() => addAlert(alert), (index + 1) * 2000)
    })
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [addAlert])

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      isConnected,
      addAlert,
      markAsRead,
      markAllAsRead,
      clearAlert,
      clearAllAlerts
    }}>
      {children}
    </AlertContext.Provider>
  )
}

// Hook to use alerts
export function useAlerts() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider')
  }
  return context
}

// Alert Icon Component
function AlertIcon({ type }: { type: AlertType }) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    anomaly: <AlertTriangle className="w-5 h-5 text-orange-500" />
  }
  return icons[type] || icons.info
}

// Single Alert Toast Component
export function AlertToast({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    anomaly: 'bg-orange-50 border-orange-200'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColors[alert.type]} max-w-md`}
    >
      <AlertIcon type={alert.type} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{alert.message}</p>
        <p className="text-gray-400 text-xs mt-1">
          {alert.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// Toast Container - shows floating alerts
export function AlertToastContainer() {
  const { alerts, clearAlert } = useAlerts()
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([])
  
  // Show new alerts as toasts for 5 seconds
  useEffect(() => {
    const recentAlerts = alerts.filter(a => 
      !a.read && 
      Date.now() - a.timestamp.getTime() < 5000
    ).slice(0, 3)
    
    setVisibleAlerts(recentAlerts)
  }, [alerts])
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleAlerts.map(alert => (
          <AlertToast
            key={alert.id}
            alert={alert}
            onDismiss={() => clearAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Alert Bell Button for header
export function AlertBell() {
  const { alerts, unreadCount, markAllAsRead, clearAlert } = useAlerts()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 ? (
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <BellRing className="w-5 h-5 text-gati-primary" />
          </motion.div>
        ) : (
          <Bell className="w-5 h-5 text-gray-600" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-gati-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  alerts.slice(0, 10).map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !alert.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertIcon type={alert.type} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{alert.message}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearAlert(alert.id)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AlertProvider
