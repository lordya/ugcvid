'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROCESSING_MESSAGES = [
  'Analyzing product...',
  'Identifying key selling points...',
  'Drafting script...',
  'Polishing content...',
]

export default function WizardScriptPage() {
  const router = useRouter()
  const {
    metadata,
    manualInput,
    script,
    setScript,
    selectedImages,
    toggleImageSelection,
    setStep,
    reset,
  } = useWizardStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get product info
  const productTitle = metadata?.title || manualInput?.title || ''
  const productDescription = metadata?.description || manualInput?.description || ''
  const availableImages = metadata?.images || []

  // Ensure step is set to 2 when component mounts
  useEffect(() => {
    setStep(2)
  }, [setStep])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
      // Set new timeout
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null)
      }, 3000)
    }
    // Cleanup on unmount or toast change
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [toast])

  // Auto-trigger script generation if script is empty and metadata exists
  useEffect(() => {
    const generateScript = async () => {
      // Check if we have metadata but no script
      if (script) {
        return // Script already exists, don't regenerate
      }

      // Get product title and description from metadata or manual input
      if (!productTitle || !productDescription) {
        // If no metadata, redirect back to step 1
        router.push('/wizard')
        return
      }

      setLoading(true)
      setError(null)
      setMessageIndex(0)
      setProcessingMessage(PROCESSING_MESSAGES[0])

      // Rotate processing messages every 2 seconds
      const messageInterval = setInterval(() => {
        setMessageIndex((prev) => {
          const next = (prev + 1) % PROCESSING_MESSAGES.length
          setProcessingMessage(PROCESSING_MESSAGES[next])
          return next
        })
      }, 2000)

      try {
        const response = await fetch('/api/generate/script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: productTitle,
            description: productDescription,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate script')
        }

        const data = await response.json()

        if (data.script) {
          setScript(data.script)
        } else {
          throw new Error('No script returned from API')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate script'
        setError(errorMessage)
        // Don't block the flow - user can manually type script
      } finally {
        clearInterval(messageInterval)
        setLoading(false)
      }
    }

    generateScript()
  }, [script, productTitle, productDescription, setScript, router])

  const handleRegenerateScript = async () => {
    if (!productTitle || !productDescription) {
      setError('Product information is missing')
      return
    }

    setLoading(true)
    setError(null)
    setMessageIndex(0)
    setProcessingMessage(PROCESSING_MESSAGES[0])

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % PROCESSING_MESSAGES.length
        setProcessingMessage(PROCESSING_MESSAGES[next])
        return next
      })
    }, 2000)

    try {
      const response = await fetch('/api/generate/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: productTitle,
          description: productDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate script')
      }

      const data = await response.json()

      if (data.script) {
        setScript(data.script)
      } else {
        throw new Error('No script returned from API')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script'
      setError(errorMessage)
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  const handleImageToggle = (imageUrl: string) => {
    const currentSelected = selectedImages.length
    const isSelected = selectedImages.includes(imageUrl)

    if (!isSelected && currentSelected >= 5) {
      setSelectionError('Maximum 5 images can be selected')
      setTimeout(() => setSelectionError(null), 3000)
      return
    }

    setSelectionError(null)
    toggleImageSelection(imageUrl)
  }

  const handleGenerateVideo = async () => {
    if (!script.trim() || selectedImages.length === 0) {
      return
    }

    setGenerating(true)
    setError(null)
    setToast(null)

    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script.trim(),
          imageUrls: selectedImages,
          aspectRatio: '9:16',
          title: productTitle,
          description: productDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 402) {
          setToast({
            message: 'Insufficient credits. Please purchase more credits to continue.',
            type: 'error',
          })
        } else {
          setToast({
            message: data.error || 'Failed to start video generation',
            type: 'error',
          })
        }
        setError(data.error || 'Failed to start video generation')
        return
      }

      // Success: Clear wizard store and redirect
      reset()
      setToast({
        message: 'Generation started! Your video is being created.',
        type: 'success',
      })

      // Redirect to library after a brief delay to show the toast
      setTimeout(() => {
        router.push('/library')
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start video generation'
      setError(errorMessage)
      setToast({
        message: errorMessage,
        type: 'error',
      })
    } finally {
      setGenerating(false)
    }
  }

  const scriptLength = script.length
  const isScriptValid = scriptLength >= 50 && scriptLength <= 500
  const isScriptTooShort = scriptLength > 0 && scriptLength < 50
  const isScriptTooLong = scriptLength > 500
  const canGenerate = script.trim().length > 0 && selectedImages.length > 0

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Generating Your Script</h1>
          <p className="text-muted-foreground">Our AI is crafting the perfect script for your product</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Animated processing indicator */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
              </div>

              {/* Processing message with shimmer effect */}
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-primary animate-pulse">
                  {processingMessage}
                </p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Review Step UI - Split Screen Layout
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Script Review</h1>
        <p className="text-muted-foreground">Review and edit your script, then select images</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-md">
          <p className="text-sm text-warning font-medium mb-1">Script generation failed</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            You can manually edit the script below or try regenerating.
          </p>
        </div>
      )}

      {/* Selection Error Toast */}
      {selectionError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">{selectionError}</p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg border transition-all animate-in slide-in-from-top-5',
            toast.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          )}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Reference/Assets */}
        <div className="space-y-6">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Product Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Title */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{productTitle}</h3>
              </div>

              {/* Product Description (Collapsible) */}
              <div>
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Description</span>
                  {descriptionExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {descriptionExpanded && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {productDescription}
                  </p>
                )}
              </div>

              {/* Image Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Select Images ({selectedImages.length}/5)
                  </label>
                  {selectedImages.length === 0 && (
                    <span className="text-xs text-warning">Select at least 1 image</span>
                  )}
                </div>
                {availableImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableImages.map((imageUrl, index) => {
                      const isSelected = selectedImages.includes(imageUrl)
                      return (
                        <button
                          key={index}
                          onClick={() => handleImageToggle(imageUrl)}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            isSelected
                              ? 'border-primary opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-layer-2'
                              : 'border-border opacity-60 hover:opacity-80 hover:border-primary/50'
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Handle image load errors
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No images available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Script Editor */}
        <div className="space-y-6">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Script Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Script Textarea */}
              <div className="space-y-2">
                <label htmlFor="script-input" className="text-sm font-medium">
                  Video Script
                </label>
                <textarea
                  id="script-input"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Your script will appear here..."
                  className={cn(
                    'flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono',
                    (isScriptTooShort || isScriptTooLong) && 'border-warning'
                  )}
                  rows={12}
                />
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'text-xs',
                      isScriptTooShort || isScriptTooLong ? 'text-warning font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {scriptLength} characters
                    {isScriptTooShort && ' • Too short (min 50)'}
                    {isScriptTooLong && ' • Too long (max 500)'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleRegenerateScript}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate Script
                </Button>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={!canGenerate || generating}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    'Generate Video • -1 Credit'
                  )}
                </Button>
              </div>

              {/* Validation Hints */}
              {(!script.trim() || selectedImages.length === 0) && (
                <div className="p-3 bg-layer-3 rounded-md text-xs text-muted-foreground">
                  {!script.trim() && <p>• Script cannot be empty</p>}
                  {selectedImages.length === 0 && <p>• Select at least 1 image</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
