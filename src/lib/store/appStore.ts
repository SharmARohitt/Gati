/**
 * GATI Global State Management with Zustand
 * Centralized store for application state
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================
// Types
// ============================================

export interface User {
  username: string
  email: string
  role: 'admin' | 'viewer'
  loginTime: Date
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    href: string
  }
}

export interface FilterState {
  state: string | null
  district: string | null
  dateRange: {
    start: string | null
    end: string | null
  }
  severity: ('low' | 'medium' | 'high' | 'critical')[]
  searchQuery: string
}

export interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Filters
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  
  // Notifications
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  
  // Loading States
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  
  // Modal State
  activeModal: string | null
  modalData: unknown
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
}

// ============================================
// Default Values
// ============================================

const defaultFilters: FilterState = {
  state: null,
  district: null,
  dateRange: {
    start: null,
    end: null,
  },
  severity: [],
  searchQuery: '',
}

// ============================================
// Store
// ============================================

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Theme
        theme: 'system',
        setTheme: (theme) => set({ theme }),

        // Sidebar
        sidebarOpen: true,
        sidebarCollapsed: false,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        // Filters
        filters: defaultFilters,
        setFilter: (key, value) =>
          set((state) => {
            state.filters[key] = value
          }),
        resetFilters: () => set({ filters: defaultFilters }),

        // Notifications
        notifications: [],
        unreadCount: 0,
        addNotification: (notification) =>
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              read: false,
            }
            state.notifications.unshift(newNotification)
            state.unreadCount += 1
            // Keep only last 50 notifications
            if (state.notifications.length > 50) {
              state.notifications = state.notifications.slice(0, 50)
            }
          }),
        markAsRead: (id) =>
          set((state) => {
            const notification = state.notifications.find((n: Notification) => n.id === id)
            if (notification && !notification.read) {
              notification.read = true
              state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
          }),
        markAllAsRead: () =>
          set((state) => {
            state.notifications.forEach((n: Notification) => (n.read = true))
            state.unreadCount = 0
          }),
        clearNotifications: () =>
          set({
            notifications: [],
            unreadCount: 0,
          }),

        // Loading States
        globalLoading: false,
        setGlobalLoading: (loading) => set({ globalLoading: loading }),

        // Modal State
        activeModal: null,
        modalData: null,
        openModal: (modalId, data = null) =>
          set({
            activeModal: modalId,
            modalData: data,
          }),
        closeModal: () =>
          set({
            activeModal: null,
            modalData: null,
          }),
      })),
      {
        name: 'gati-app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          filters: state.filters,
        }),
      }
    ),
    { name: 'GATI Store' }
  )
)

// ============================================
// Selectors (for optimized re-renders)
// ============================================

export const selectTheme = (state: AppState) => state.theme
export const selectSidebarOpen = (state: AppState) => state.sidebarOpen
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed
export const selectFilters = (state: AppState) => state.filters
export const selectNotifications = (state: AppState) => state.notifications
export const selectUnreadCount = (state: AppState) => state.unreadCount
export const selectGlobalLoading = (state: AppState) => state.globalLoading
export const selectActiveModal = (state: AppState) => state.activeModal

// ============================================
// Hooks for specific slices
// ============================================

export function useTheme() {
  const theme = useAppStore(selectTheme)
  const setTheme = useAppStore((state) => state.setTheme)
  return { theme, setTheme }
}

export function useSidebar() {
  const sidebarOpen = useAppStore(selectSidebarOpen)
  const sidebarCollapsed = useAppStore(selectSidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  return { sidebarOpen, sidebarCollapsed, toggleSidebar, setSidebarCollapsed }
}

export function useFilters() {
  const filters = useAppStore(selectFilters)
  const setFilter = useAppStore((state) => state.setFilter)
  const resetFilters = useAppStore((state) => state.resetFilters)
  return { filters, setFilter, resetFilters }
}

export function useNotifications() {
  const notifications = useAppStore(selectNotifications)
  const unreadCount = useAppStore(selectUnreadCount)
  const addNotification = useAppStore((state) => state.addNotification)
  const markAsRead = useAppStore((state) => state.markAsRead)
  const markAllAsRead = useAppStore((state) => state.markAllAsRead)
  const clearNotifications = useAppStore((state) => state.clearNotifications)
  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}

export function useModal() {
  const activeModal = useAppStore(selectActiveModal)
  const modalData = useAppStore((state) => state.modalData)
  const openModal = useAppStore((state) => state.openModal)
  const closeModal = useAppStore((state) => state.closeModal)
  return { activeModal, modalData, openModal, closeModal }
}

export function useGlobalLoading() {
  const globalLoading = useAppStore(selectGlobalLoading)
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading)
  return { globalLoading, setGlobalLoading }
}
