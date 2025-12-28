/**
 * Validation utilities for video generation inputs
 * Ensures style and duration combinations are valid before API calls
 */

export const SUPPORTED_STYLES = ['ugc_auth', 'green_screen', 'pas_framework', 'asmr_visual', 'before_after', 'storyboard'] as const
export const SUPPORTED_DURATIONS = ['10s', '15s', '25s'] as const

export type SupportedStyle = typeof SUPPORTED_STYLES[number]
export type SupportedDuration = typeof SUPPORTED_DURATIONS[number]

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates style and duration combination
 * @param style - Video style identifier
 * @param duration - Video duration ('10s' or '15s')
 * @returns Validation result with error message if invalid
 */
export function validateStyleDuration(style: string, duration: string): ValidationResult {
  if (!SUPPORTED_STYLES.includes(style as SupportedStyle)) {
    return { 
      valid: false, 
      error: `Unsupported style: ${style}. Supported styles: ${SUPPORTED_STYLES.join(', ')}` 
    }
  }
  
  if (!SUPPORTED_DURATIONS.includes(duration as SupportedDuration)) {
    return { 
      valid: false, 
      error: `Unsupported duration: ${duration}. Supported durations: ${SUPPORTED_DURATIONS.join(', ')}` 
    }
  }
  
  return { valid: true }
}

/**
 * Validates that a style string is supported
 * @param style - Video style identifier
 * @returns Validation result
 */
export function validateStyle(style: string): ValidationResult {
  if (!SUPPORTED_STYLES.includes(style as SupportedStyle)) {
    return { 
      valid: false, 
      error: `Unsupported style: ${style}. Supported styles: ${SUPPORTED_STYLES.join(', ')}` 
    }
  }
  return { valid: true }
}

/**
 * Validates that a duration string is supported
 * @param duration - Video duration
 * @returns Validation result
 */
export function validateDuration(duration: string): ValidationResult {
  if (!SUPPORTED_DURATIONS.includes(duration as SupportedDuration)) {
    return { 
      valid: false, 
      error: `Unsupported duration: ${duration}. Supported durations: ${SUPPORTED_DURATIONS.join(', ')}` 
    }
  }
  return { valid: true }
}

