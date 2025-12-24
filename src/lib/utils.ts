import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple token encryption/decryption functions
// Note: In production, use proper encryption with environment-based keys
export function encryptToken(token: string): string {
  // Simple base64 encoding for demo purposes
  // In production, use proper AES encryption with environment variables
  return `encrypted:${btoa(token)}`
}

export function decryptToken(encryptedToken: string): string {
  // Remove 'encrypted:' prefix and decode
  if (encryptedToken.startsWith('encrypted:')) {
    return atob(encryptedToken.slice(11))
  }
  return encryptedToken // fallback for unencrypted tokens
}

