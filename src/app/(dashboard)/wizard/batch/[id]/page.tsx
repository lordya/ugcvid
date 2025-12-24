'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
  Play,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScriptEditorModal } from '@/components/wizard/ScriptEditorModal'

interface BatchStatusResponse {
  batch: {
    id: string
    status: string
    totalItems: number
    processedItems: number
    failedItems: number
    pendingItems: number
    progress: number
    totalCreditsReserved: number
    errorMessage?: string
    createdAt: string
    updatedAt: string
  }
  items: BatchItemStatus[]
  processingCount: number
}

interface BatchItemStatus {
  id: string
  rowIndex: number
  url: string
  customTitle?: string
  style?: string
  status: string
  errorMessage?: string
  creditsUsed: number
  script?: string
  ugcContent?: any
  selectedImages?: string[]
  video?: {
    id: string
    status: string
    videoUrl?: string
    errorReason?: string
    createdAt: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export default function BatchReviewPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string

  const [batchData, setBatchData] = useState<BatchStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isStartingProcessing, setIsStartingProcessing] = useState(false)
  const [editingItem, setEditingItem] = useState<BatchItemStatus | null>(null)
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false)

  // Initialize all items as selected by default (Generate Video toggle defaults to ON)
  useEffect(() => {
    if (batchData?.items) {
      const completedItems = batchData.items
        .filter(item => item.status === 'COMPLETED' && item.script)
        .map(item => item.id)
      setSelectedItems(new Set(completedItems))
    }
  }, [batchData])

  // Fetch batch status
  const fetchBatchStatus = useCallback(async () => {
    if (!batchId) return

    try {
      const response = await fetch(`/api/bulk/batch/${batchId}/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch batch status')
      }

      const data: BatchStatusResponse = await response.json()
      setBatchData(data)
      setLastUpdate(new Date())

      // Stop polling if batch is completed or failed
      if (data.batch.status === 'COMPLETED' || data.batch.status === 'FAILED') {
        return false // Stop polling
      }

      return true // Continue polling
    } catch (err) {
      console.error('Error fetching batch status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch batch status')
      return true // Continue polling despite errors
    }
  }, [batchId])

  // Initial load
  useEffect(() => {
    const loadBatch = async () => {
      setLoading(true)
      setError(null)
      await fetchBatchStatus()
      setLoading(false)
    }

    loadBatch()
  }, [fetchBatchStatus])

  // Polling effect
  useEffect(() => {
    if (!batchId || loading) return

    // Initial poll
    fetchBatchStatus()

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(() => {
      fetchBatchStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [batchId, loading, fetchBatchStatus])

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

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Script Ready'
      case 'FAILED':
        return 'Failed to Scrape'
      case 'PROCESSING':
        return 'Generating Script'
      default:
        return 'Pending'
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleStartProcessing = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item to process')
      return
    }

    setIsStartingProcessing(true)
    setError(null)

    try {
      // Start video generation for selected items
      const response = await fetch(`/api/bulk/batch/${batchId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start video generation')
      }

      // Navigate to processing page
      router.push('/wizard/bulk-process')
    } catch (err) {
      console.error('Error starting processing:', err)
      setError(err instanceof Error ? err.message : 'Failed to start video generation')
    } finally {
      setIsStartingProcessing(false)
    }
  }

  const handleEditScript = (item: BatchItemStatus) => {
    setEditingItem(item)
    setIsScriptModalOpen(true)
  }

  const handleSaveScript = async (itemId: string, newScript: string) => {
    // TODO: Implement API call to update script
    console.log('Saving script for item:', itemId, 'new script:', newScript)
    // For now, just update local state
    // In real implementation, this would call an API endpoint
  }

  const handleDeleteItem = async (item: BatchItemStatus) => {
    if (!confirm(`Are you sure you want to delete Row ${item.rowIndex}? This will refund ${item.creditsUsed || 1} credit(s).`)) {
      return
    }

    try {
      const response = await fetch(`/api/bulk/batch/${batchId}/items/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }

      // Refresh batch data
      await fetchBatchStatus()

      // Remove from selected items if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })

    } catch (err) {
      console.error('Error deleting item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Batch Review</h1>
          <p className="text-muted-foreground">Loading batch details...</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-medium">Loading Batch</p>
                <p className="text-sm text-muted-foreground">Fetching batch details and scripts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !batchData) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Batch Review</h1>
          <p className="text-muted-foreground">Failed to load batch details</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Load Failed</h3>
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

  if (!batchData) return null

  const { batch, items } = batchData
  const completedItems = items.filter(item => item.status === 'COMPLETED' && item.script)
  const hasCompletedItems = completedItems.length > 0

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Batch Review</h1>
        <p className="text-muted-foreground">
          Review and approve scripts for {batch.totalItems} video{batch.totalItems > 1 ? 's' : ''} before generation
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Batch ID: {batchId}
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-layer-2 border-border">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">Processing Progress</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchBatchStatus()}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="bg-success/10 text-success">
                  {batch.processedItems - batch.failedItems} Ready
                </Badge>
                <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                  {batch.failedItems} Failed
                </Badge>
                <Badge variant="outline">
                  {batch.pendingItems} Pending
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Script Generation Progress</span>
                <span>{batch.progress}%</span>
              </div>
              <Progress value={batch.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>

            {batch.status === 'FAILED' && batch.errorMessage && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{batch.errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Items Grid */}
      <Card className="bg-layer-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Scripts</span>
            {hasCompletedItems && (
              <Button
                onClick={handleStartProcessing}
                disabled={selectedItems.size === 0 || isStartingProcessing}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {isStartingProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Processing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Processing Selected ({selectedItems.size})
                  </>
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found in this batch</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between p-4 bg-layer-3">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        disabled={item.status !== 'COMPLETED' || !item.script}
                      />
                      <button
                        onClick={() => toggleItemExpansion(item.id)}
                        className="flex items-center space-x-2 hover:bg-layer-2 rounded p-1"
                      >
                        {expandedItems.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Row {item.rowIndex}</span>
                          <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                            {getStatusDisplayText(item.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {item.url}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.status === 'COMPLETED' && item.script && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScript(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Item Details (Expandable) */}
                  {expandedItems.has(item.id) && (
                    <div className="p-4 border-t border-border">
                      <div className="space-y-4">
                        {/* Product Info */}
                        <div>
                          <h4 className="font-medium mb-2">Product Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">URL</p>
                              <p className="text-sm break-all">{item.url}</p>
                            </div>
                            {item.customTitle && (
                              <div>
                                <p className="text-sm text-muted-foreground">Custom Title</p>
                                <p className="text-sm">{item.customTitle}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Script Content */}
                        {item.script && (
                          <div>
                            <h4 className="font-medium mb-2">Generated Script</h4>
                            <div className="bg-layer-1 rounded p-3 border">
                              <p className="text-sm whitespace-pre-wrap">{item.script}</p>
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {item.errorMessage && (
                          <div>
                            <h4 className="font-medium mb-2 text-destructive">Error</h4>
                            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                              <p className="text-sm text-destructive">{item.errorMessage}</p>
                            </div>
                          </div>
                        )}

                        {/* Credits */}
                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <span className="text-sm text-muted-foreground">Credits Required</span>
                          <span className="text-sm font-mono">{item.creditsUsed || 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Script Editor Modal */}
      <ScriptEditorModal
        item={editingItem}
        isOpen={isScriptModalOpen}
        onClose={() => {
          setIsScriptModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveScript}
      />
    </div>
  )
}
