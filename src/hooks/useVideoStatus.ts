'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export type VideoStatus = 'DRAFT' | 'SCRIPT_GENERATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface VideoStatusData {
  id: string
  status: VideoStatus
  videoUrl?: string
  errorReason?: string
  progress?: number
  duration?: number // Video duration in seconds (10 or 15)
  createdAt?: string // ISO timestamp of video creation
}

interface UseVideoStatusOptions {
  videoId: string
  initialStatus?: VideoStatus
  pollInterval?: number // milliseconds, default calculated dynamically
  enabled?: boolean // whether polling is enabled, default true
  duration?: number // Video duration in seconds (10 or 15) for dynamic polling
  createdAt?: string // ISO timestamp of video creation for elapsed time calculation
}

interface UseVideoStatusResult {
  data: VideoStatusData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Calculate dynamic polling interval based on video duration and elapsed time
 * Shorter intervals early on, longer intervals as time passes
 * @param duration - Video duration in seconds (10 or 15)
 * @param elapsedMinutes - Minutes since video creation
 * @returns Polling interval in milliseconds
 */
function getPollInterval(duration: number, elapsedMinutes: number): number {
  // For 10-second videos, they typically complete faster
  if (duration === 10) {
    if (elapsedMinutes < 0.5) return 10000  // 10s for first 30 seconds
    if (elapsedMinutes < 2) return 20000    // 20s for next 1.5 minutes
    if (elapsedMinutes < 5) return 30000    // 30s for minutes 2-5
    return 60000 // 60s after 5 minutes
  }
  
  // For 15-second videos, they take longer
  if (elapsedMinutes < 1) return 10000   // 10s for first minute
  if (elapsedMinutes < 3) return 20000    // 20s for minutes 1-3
  if (elapsedMinutes < 5) return 30000    // 30s for minutes 3-5
  return 60000 // 60s after 5 minutes
}

/**
 * Custom hook to poll video status from the API
 * Automatically polls with dynamic intervals when status is PROCESSING
 * Stops polling when status reaches COMPLETED or FAILED
 */
export function useVideoStatus({
  videoId,
  initialStatus,
  pollInterval, // Optional override, otherwise calculated dynamically
  enabled = true,
  duration,
  createdAt,
}: UseVideoStatusOptions): UseVideoStatusResult {
  const [data, setData] = useState<VideoStatusData | null>(
    initialStatus
      ? {
          id: videoId,
          status: initialStatus,
          duration,
          createdAt,
        }
      : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const startTimeRef = useRef<Date | null>(createdAt ? new Date(createdAt) : null)

  const fetchStatus = useCallback(async () => {
    if (!enabled || !isMountedRef.current) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/videos/${videoId}/status`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: VideoStatusData = await response.json()

      if (isMountedRef.current) {
        setData(result)
        // Update start time if we get createdAt from API
        if (result.createdAt && !startTimeRef.current) {
          startTimeRef.current = new Date(result.createdAt)
        }
        // Update duration if provided
        if (result.duration && !duration) {
          // Duration will be used in next polling calculation
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch video status')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [videoId, enabled, duration])

  const refetch = useCallback(async () => {
    await fetchStatus()
  }, [fetchStatus])

  // Set up polling based on current status
  useEffect(() => {
    isMountedRef.current = true

    // Initial fetch
    if (enabled) {
      fetchStatus()
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, fetchStatus])

  // Manage polling interval based on status
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Only poll if status is PROCESSING
    if (data?.status === 'PROCESSING') {
      // Calculate dynamic polling interval
      const videoDuration = data.duration || duration || 15 // Default to 15s if unknown
      const elapsedMinutes = startTimeRef.current 
        ? (Date.now() - startTimeRef.current.getTime()) / (1000 * 60)
        : 0
      
      const calculatedInterval = pollInterval || getPollInterval(videoDuration, elapsedMinutes)
      
      // Clear existing interval if it exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // Start polling with calculated interval
      intervalRef.current = setInterval(() => {
        fetchStatus()
      }, calculatedInterval)
    } else {
      // Stop polling for final states (COMPLETED, FAILED) or other states
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [data?.status, data?.duration, enabled, pollInterval, duration, fetchStatus])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

