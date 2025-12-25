'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, BatchStatus, BatchItemStatus } from '@/store/useWizardStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react'

interface BatchStatusResponse {
  batch: BatchStatus
  items: BatchItemStatus[]
  processingCount: number
}

export default function BulkProcessPage() {
  const router = useRouter()
  const {
    bulkCorrectedRows,
    currentBatchId,
    batchStatus,
    batchItems,
    startBatch,
    updateBatchStatus,
    clearBatch
  } = useWizardStore()

  const [isStartingBatch, setIsStartingBatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Start batch processing
  const initiateBatchProcessing = useCallback(async () => {
    if (!bulkCorrectedRows.length) {
      router.push('/wizard')
      return
    }

    setIsStartingBatch(true)
    setError(null)

    try {
      // Prepare items for batch processing
      const batchItems = bulkCorrectedRows.map((row, index) => ({
        url: row.url,
        custom_title: row.custom_title || undefined,
        style: row.style || 'ugc_auth',
        row_index: row.rowIndex
      }))

      // Start batch via API
      const response = await fetch('/api/bulk/start-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: batchItems,
          default_style: 'ugc_auth',
          default_duration: '15s'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start batch processing')
      }

      const result = await response.json()

      // Update store with batch ID
      startBatch(result.batchId)

    } catch (err) {
      console.error('Error starting batch:', err)
      setError(err instanceof Error ? err.message : 'Failed to start batch processing')
    } finally {
      setIsStartingBatch(false)
    }
  }, [bulkCorrectedRows, router, startBatch])

  // Poll for batch status updates
  const pollBatchStatus = useCallback(async () => {
    if (!currentBatchId) return

    try {
      const response = await fetch(`/api/bulk/batch/${currentBatchId}/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch batch status')
      }

      const data: BatchStatusResponse = await response.json()
      updateBatchStatus(data.batch, data.items)
      setLastUpdate(new Date())

      // Stop polling if batch is completed or failed
      if (data.batch.status === 'COMPLETED' || data.batch.status === 'FAILED') {
        return false // Stop polling
      }

      return true // Continue polling
    } catch (err) {
      console.error('Error polling batch status:', err)
      return true // Continue polling despite errors
    }
  }, [currentBatchId, updateBatchStatus])

  // Effect to start batch processing on mount
  useEffect(() => {
    if (bulkCorrectedRows.length === 0) {
      router.push('/wizard')
      return
    }

    // If we don't have a batch ID yet, start the batch
    if (!currentBatchId && !isStartingBatch) {
      initiateBatchProcessing()
    }
  }, [bulkCorrectedRows, currentBatchId, isStartingBatch, router, initiateBatchProcessing])

  // Effect to poll batch status
  useEffect(() => {
    if (!currentBatchId) return

    // Initial poll
    pollBatchStatus()

    // Set up polling interval
    const interval = setInterval(() => {
      pollBatchStatus()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [currentBatchId, pollBatchStatus])

  const handleGoToLibrary = () => {
    clearBatch()
    router.push('/library')
  }

  const handleManualRefresh = () => {
    pollBatchStatus()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'FAILED':
        return 'destructive'
      case 'PROCESSING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Show loading state while starting batch
  if (isStartingBatch) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Bulk Video Generation</h1>
          <p className="text-muted-foreground">Starting batch processing...</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-medium">Initializing Batch</p>
                <p className="text-sm text-muted-foreground">Preparing {bulkCorrectedRows.length} videos for processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error && !batchStatus) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Bulk Video Generation</h1>
          <p className="text-muted-foreground">Failed to start batch processing</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Batch Start Failed</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => router.push('/wizard')} variant="outline">
                Return to Wizard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show batch processing UI
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Bulk Video Generation</h1>
        <p className="text-muted-foreground">
          Processing {batchStatus?.totalItems || 0} video{(batchStatus?.totalItems || 0) > 1 ? 's' : ''} from your CSV upload
        </p>
        {currentBatchId && (
          <p className="text-xs text-muted-foreground mt-2">
            Batch ID: {currentBatchId}
          </p>
        )}
      </div>

      {/* Progress Overview */}
      {batchStatus && (
        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold">Processing Progress</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManualRefresh}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="default" className="bg-success/10 text-success">
                    {batchStatus.processedItems - batchStatus.failedItems} Completed
                  </Badge>
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                    {batchStatus.failedItems} Failed
                  </Badge>
                  <Badge variant="outline">
                    {batchStatus.pendingItems} Remaining
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{batchStatus.progress}%</span>
                </div>
                <Progress value={batchStatus.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>

              {batchStatus.status === 'COMPLETED' && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-success">Bulk Generation Complete!</h3>
                    <p className="text-muted-foreground">
                      {batchStatus.processedItems - batchStatus.failedItems} video{(batchStatus.processedItems - batchStatus.failedItems) > 1 ? 's' : ''} successfully created
                      {batchStatus.failedItems > 0 && `, ${batchStatus.failedItems} failed`}
                    </p>
                  </div>
                  <Button onClick={handleGoToLibrary} size="lg">
                    View Videos in Library
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {batchStatus.status === 'FAILED' && batchStatus.errorMessage && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{batchStatus.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Items List */}
      {batchItems.length > 0 && (
        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Processing Details</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    item.status === 'PROCESSING'
                      ? 'bg-primary/5 border-primary/20'
                      : item.status === 'COMPLETED'
                        ? 'bg-success/5 border-success/20'
                        : item.status === 'FAILED'
                          ? 'bg-destructive/5 border-destructive/20'
                          : 'bg-layer-3 border-border'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Row {item.rowIndex}</span>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                          {item.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {item.url}
                      </p>
                      {item.customTitle && (
                        <p className="text-sm text-primary truncate max-w-md">
                          {item.customTitle}
                        </p>
                      )}
                      {item.errorMessage && (
                        <p className="text-sm text-destructive mt-1">
                          {item.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {item.status === 'PROCESSING' && (
                      <div className="flex items-center space-x-2 text-sm text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                    {item.video && (
                      <div className="text-xs text-muted-foreground">
                        <p>Video ID: {item.video.id}</p>
                        {item.video.videoUrl && (
                          <p className="text-success">Ready to download</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
