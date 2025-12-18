'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export type VideoStatus = 'DRAFT' | 'SCRIPT_GENERATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface VideoStatusData {
  id: string
  status: VideoStatus
  videoUrl?: string
  errorReason?: string
  progress?: number
}

interface UseVideoStatusOptions {
  videoId: string
  initialStatus?: VideoStatus
  pollInterval?: number // milliseconds, default 5000 (5 seconds)
  enabled?: boolean // whether polling is enabled, default true
}

interface UseVideoStatusResult {
  data: VideoStatusData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook to poll video status from the API
 * Automatically polls every 5 seconds when status is PROCESSING
 * Stops polling when status reaches COMPLETED or FAILED
 */
export function useVideoStatus({
  videoId,
  initialStatus,
  pollInterval = 5000,
  enabled = true,
}: UseVideoStatusOptions): UseVideoStatusResult {
  const [data, setData] = useState<VideoStatusData | null>(
    initialStatus
      ? {
          id: videoId,
          status: initialStatus,
        }
      : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

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
  }, [videoId, enabled])

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
      // Start polling if not already started
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          fetchStatus()
        }, pollInterval)
      }
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
  }, [data?.status, enabled, pollInterval, fetchStatus])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

