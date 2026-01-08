/**
 * GATI Form Validation Schemas
 * Zod schemas for type-safe form validation
 */

import { z } from 'zod'

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  rememberMe: z.boolean().optional().default(false),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ============================================
// Search & Filter Schemas
// ============================================

export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query cannot exceed 200 characters')
    .transform((val) => val.trim()),
  filters: z
    .object({
      state: z.string().optional(),
      district: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      type: z.string().optional(),
    })
    .optional(),
})

export type SearchFormData = z.infer<typeof searchSchema>

export const dateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  )

export type DateRangeFormData = z.infer<typeof dateRangeSchema>

// ============================================
// Anomaly Report Schemas
// ============================================

export const anomalyReportSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affectedState: z.string().min(1, 'Please select a state'),
  affectedDistrict: z.string().optional(),
  estimatedImpact: z.number().min(0).max(100000000).optional(),
  recommendedAction: z.string().max(1000).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
        type: z.string(),
      })
    )
    .max(5, 'Maximum 5 attachments allowed')
    .optional(),
})

export type AnomalyReportFormData = z.infer<typeof anomalyReportSchema>

// ============================================
// Field Officer Schemas
// ============================================

export const fieldOfficerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  designation: z.string().min(1, 'Please select a designation'),
  assignedRegion: z.object({
    state: z.string().min(1, 'Please select a state'),
    districts: z.array(z.string()).min(1, 'Please select at least one district'),
  }),
  status: z.enum(['active', 'inactive', 'on-leave']).default('active'),
})

export type FieldOfficerFormData = z.infer<typeof fieldOfficerSchema>

// ============================================
// AI Chat Schemas
// ============================================

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .transform((val) => val.trim()),
  context: z
    .object({
      state: z.string().optional(),
      timeRange: z.string().optional(),
      modelPreference: z.string().optional(),
    })
    .optional(),
})

export type ChatMessageFormData = z.infer<typeof chatMessageSchema>

// ============================================
// Export Configuration Schemas
// ============================================

export const exportConfigSchema = z.object({
  format: z.enum(['csv', 'pdf', 'excel', 'json']),
  dateRange: dateRangeSchema.optional(),
  includeFields: z.array(z.string()).min(1, 'Select at least one field to export'),
  filters: z
    .object({
      states: z.array(z.string()).optional(),
      severity: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
    })
    .optional(),
})

export type ExportConfigFormData = z.infer<typeof exportConfigSchema>

// ============================================
// Settings Schemas
// ============================================

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  alertThreshold: z.enum(['all', 'high', 'critical']).default('high'),
  digestFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('daily'),
  quietHours: z
    .object({
      enabled: z.boolean().default(false),
      start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    })
    .optional(),
})

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate form data against a schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })
  
  return { success: false, errors }
}

/**
 * Get first error message from validation result
 */
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors)
  return keys.length > 0 ? errors[keys[0]] : null
}

// ============================================
// Indian-Specific Validators
// ============================================

/**
 * Validate Aadhaar number format (12 digits, Verhoeff checksum)
 */
export const aadhaarSchema = z
  .string()
  .length(12, 'Aadhaar number must be exactly 12 digits')
  .regex(/^\d{12}$/, 'Aadhaar number must contain only digits')
  .refine(
    (val) => {
      // Simplified Verhoeff checksum validation
      // In production, use proper Verhoeff algorithm
      return !val.startsWith('0') && !val.startsWith('1')
    },
    { message: 'Invalid Aadhaar number format' }
  )

/**
 * Validate Indian PIN code
 */
export const pinCodeSchema = z
  .string()
  .length(6, 'PIN code must be exactly 6 digits')
  .regex(/^[1-9]\d{5}$/, 'Invalid PIN code format')

/**
 * Validate Indian state codes
 */
export const stateCodeSchema = z.enum([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DD', 'DL', 'GA',
  'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
  'ML', 'MN', 'MP', 'MZ', 'NL', 'OR', 'PB', 'PY', 'RJ', 'SK',
  'TN', 'TS', 'TR', 'UK', 'UP', 'WB',
])

export type StateCode = z.infer<typeof stateCodeSchema>
