// Validation utilities for GATI Platform

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate state code or name
 */
export function validateState(state: string): ValidationResult {
  const errors: string[] = [];
  
  if (!state || typeof state !== 'string') {
    errors.push('State parameter is required and must be a string');
  }
  
  if (state.length < 2 || state.length > 50) {
    errors.push('State name/code must be between 2 and 50 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: string[] = [];
  
  if (!startDate || !endDate) {
    errors.push('Both startDate and endDate are required');
    return { valid: false, errors };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    errors.push('Invalid startDate format');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('Invalid endDate format');
  }
  
  if (start > end) {
    errors.push('startDate must be before endDate');
  }
  
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    errors.push('Date range cannot exceed 365 days');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pincode
 */
export function validatePincode(pincode: string): ValidationResult {
  const errors: string[] = [];
  
  if (!pincode || typeof pincode !== 'string') {
    errors.push('Pincode is required and must be a string');
    return { valid: false, errors };
  }
  
  // Indian pincode is 6 digits
  if (!/^\d{6}$/.test(pincode)) {
    errors.push('Pincode must be exactly 6 digits');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate forecast periods
 */
export function validateForecastPeriods(periods: number): ValidationResult {
  const errors: string[] = [];
  
  if (typeof periods !== 'number' || isNaN(periods)) {
    errors.push('Periods must be a valid number');
    return { valid: false, errors };
  }
  
  if (periods < 1) {
    errors.push('Periods must be at least 1');
  }
  
  if (periods > 180) {
    errors.push('Periods cannot exceed 180 days');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate metric type
 */
export function validateMetric(metric: string): ValidationResult {
  const validMetrics = ['enrolments', 'biometricUpdates', 'demographicUpdates'];
  const errors: string[] = [];
  
  if (!metric || typeof metric !== 'string') {
    errors.push('Metric is required');
    return { valid: false, errors };
  }
  
  if (!validMetrics.includes(metric)) {
    errors.push(`Metric must be one of: ${validMetrics.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

