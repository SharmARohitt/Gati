/**
 * GATI Form Hooks
 * React Hook Form integration with Zod validation
 */

import { useForm, UseFormReturn, FieldValues, DefaultValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCallback, useState } from 'react'

// ============================================
// Generic Form Hook
// ============================================

interface UseValidatedFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => Promise<void> | void
  onError?: (errors: Record<string, string>) => void
}

interface UseValidatedFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  isSubmitting: boolean
  submitError: string | null
  handleFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  clearSubmitError: () => void
}

/**
 * Custom hook for validated forms with Zod
 */
export function useValidatedForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
}: UseValidatedFormOptions<T>) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: 'onBlur', // Validate on blur for better UX
  })

  const { handleSubmit, formState } = form

  const handleFormSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault()
      setSubmitError(null)

      await handleSubmit(
        async (data) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await onSubmit(data as any)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred'
            setSubmitError(message)
          }
        },
        (errors) => {
          if (onError) {
            const errorMessages: Record<string, string> = {}
            Object.entries(errors).forEach(([key, value]) => {
              if (value?.message) {
                errorMessages[key] = value.message as string
              }
            })
            onError(errorMessages)
          }
        }
      )(e)
    },
    [handleSubmit, onSubmit, onError]
  )

  const clearSubmitError = useCallback(() => {
    setSubmitError(null)
  }, [])

  return {
    ...form,
    isSubmitting: formState.isSubmitting,
    submitError,
    handleFormSubmit,
    clearSubmitError,
  }
}

// ============================================
// Debounced Input Hook
// ============================================

interface UseDebouncedInputOptions {
  delay?: number
  minLength?: number
}

export function useDebouncedInput(
  callback: (value: string) => void,
  options: UseDebouncedInputOptions = {}
) {
  const { delay = 300, minLength = 0 } = options
  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue)

      const handler = setTimeout(() => {
        setDebouncedValue(newValue)
        if (newValue.length >= minLength) {
          callback(newValue)
        }
      }, delay)

      return () => clearTimeout(handler)
    },
    [callback, delay, minLength]
  )

  return {
    value,
    debouncedValue,
    handleChange,
    setValue,
  }
}

// ============================================
// Field Error Hook
// ============================================

export function useFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
): string | undefined {
  const error = form.formState.errors[fieldName]
  return error?.message as string | undefined
}

// ============================================
// Form Field Component Props
// ============================================

export interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autoComplete?: string
  hint?: string
}

// ============================================
// Multi-Step Form Hook
// ============================================

interface UseMultiStepFormOptions<T extends FieldValues> {
  steps: Array<{
    id: string
    title: string
    fields: Path<T>[]
    schema?: z.ZodSchema
  }>
  schema: z.ZodSchema<T>
  defaultValues?: DefaultValues<T>
  onComplete: (data: T) => Promise<void> | void
}

export function useMultiStepForm<T extends FieldValues>({
  steps,
  schema,
  defaultValues,
  onComplete,
}: UseMultiStepFormOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const form = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: 'onBlur',
  })

  const { trigger, handleSubmit } = form

  const currentStepConfig = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const validateCurrentStep = useCallback(async () => {
    const fields = currentStepConfig.fields
    const isValid = await trigger(fields)
    return isValid
  }, [currentStepConfig, trigger])

  const goToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (isValid && !isLastStep) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep))
      setCurrentStep((prev) => prev + 1)
    }
    return isValid
  }, [validateCurrentStep, isLastStep, currentStep])

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [isFirstStep])

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        // Only allow going to completed steps or current step
        if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
          setCurrentStep(stepIndex)
        }
      }
    },
    [steps.length, currentStep, completedSteps]
  )

  const submitForm = useCallback(async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      await handleSubmit(onComplete)()
    }
  }, [validateCurrentStep, handleSubmit, onComplete])

  return {
    form,
    currentStep,
    currentStepConfig,
    steps,
    isFirstStep,
    isLastStep,
    progress,
    completedSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submitForm,
    validateCurrentStep,
  }
}

// ============================================
// Form Persistence Hook
// ============================================

const FORM_STORAGE_PREFIX = 'gati_form_'

export function useFormPersistence<T extends FieldValues>(
  formId: string,
  form: UseFormReturn<T>,
  options: { enabled?: boolean; debounceMs?: number } = {}
) {
  const { enabled = true, debounceMs = 1000 } = options
  const storageKey = `${FORM_STORAGE_PREFIX}${formId}`

  // Load saved data on mount
  const loadSavedData = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        return data
      }
    } catch {
      console.error('Failed to load saved form data')
    }
    return null
  }, [enabled, storageKey])

  // Save form data
  const saveFormData = useCallback(
    (data: Partial<T>) => {
      if (!enabled || typeof window === 'undefined') return

      try {
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch {
        console.error('Failed to save form data')
      }
    },
    [enabled, storageKey]
  )

  // Clear saved data
  const clearSavedData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(storageKey)
    } catch {
      console.error('Failed to clear saved form data')
    }
  }, [storageKey])

  // Watch form changes and save
  const { watch } = form

  useState(() => {
    let timeout: NodeJS.Timeout

    const subscription = watch((data) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        saveFormData(data as Partial<T>)
      }, debounceMs)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  })

  return {
    loadSavedData,
    saveFormData,
    clearSavedData,
  }
}
