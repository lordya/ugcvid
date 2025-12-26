'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, ChevronDown, ChevronUp, RotateCcw, Eye, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { validateStyleDuration } from '@/lib/validation'

const PROCESSING_MESSAGES = [
  'Analyzing product...',
  'Identifying key selling points...',
  'Drafting script...',
  'Polishing content...',
]

// Helper function to extract time range from visual cue string
function extractTimeRange(visualCue: string): string {
  const match = visualCue.match(/^(\d+-\d+s):/)
  return match ? match[1] : '0-0s'
}

// Helper function to extract description from visual cue string
function extractVisualDescription(visualCue: string): string {
  const match = visualCue.match(/^\d+-\d+s:\s*(.+)$/)
  return match ? match[1] : visualCue
}

// Helper function to extract description from voiceover string
function extractVoiceoverText(voiceover: string): string {
  const match = voiceover.match(/^[^(]*\(([^)]+)\):\s*(.+)$/)
  return match ? match[2] : voiceover
}

export default function WizardScriptPage() {
  const router = useRouter()
  const {
    metadata,
    manualInput,
    script,
    setScript,
    ugcContent,
    setUgcContent,
    structuredScript,
    setStructuredScript,
    editedVoiceover,
    setEditedVoiceover,
    updateVoiceoverSegment,
    selectedImages,
    toggleImageSelection,
    setStep,
    reset,
    style,
    duration,
    language,
  } = useWizardStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Get product info
  const productTitle = metadata?.title || manualInput?.title || ''
  const productDescription = metadata?.description || manualInput?.description || ''
  const availableImages = metadata?.images || []

  // Ensure step is set to 2 when component mounts
  useEffect(() => {
    setStep(2)
  }, [setStep])


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
            style,
            duration,
            language: language || 'en',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate script')
        }

        const data = await response.json()

        // Handle structured script content response
        if (data.scriptContent) {
          setStructuredScript(data.scriptContent)
          // Initialize edited voiceover with the generated voiceover
          setEditedVoiceover(data.scriptContent.voiceover || [])
          // Set script for backward compatibility (combine voiceover)
          setScript(data.scriptContent.voiceover?.join(' ') || '')
          // Store UGC content for video generation (create basic structure)
          setUgcContent({
            Title: data.scriptContent.style || 'Generated Script',
            Caption: data.scriptContent.voiceover?.join(' ') || '',
            Description: data.scriptContent.tone_instructions || '',
            Prompt: data.scriptContent.voiceover?.join(' ') || '',
            aspect_ratio: 'portrait'
          })
        } else if (data.script) {
          // Backward compatibility
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
  }, [script, productTitle, productDescription, setScript, router, style, duration, language, setEditedVoiceover, setStructuredScript, setUgcContent])

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
          style,
          duration,
          language: language || 'en',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate script')
      }

      const data = await response.json()

      if (data.scriptContent) {
        setStructuredScript(data.scriptContent)
        setEditedVoiceover(data.scriptContent.voiceover || [])
        setScript(data.scriptContent.voiceover?.join(' ') || '')
      } else if (data.script) {
        setScript(data.script)
        setStructuredScript(null)
        setEditedVoiceover([])
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
    if ((!script.trim() && !structuredScript) || selectedImages.length === 0) {
      return
    }

    // Validate style and duration combination
    const validation = validateStyleDuration(style, duration)
    if (!validation.valid) {
      setError(validation.error || 'Invalid style or duration combination')
      toast.error('Validation Error', {
        description: validation.error || 'Please select a valid style and duration',
      })
      return
    }

    setGenerating(true)
    setError(null)

    // Show loading toast with progress indication
    const toastId = toast.loading('Generation Started... (Est. 45s)', {
      description: 'Your video is being created. This may take a moment.',
      duration: 5000,
    })

    try {
      // Prepare the script content for Kie.ai
      let finalScript = script.trim()

      if (structuredScript && editedVoiceover.length > 0) {
        // Combine visual cues and edited voiceover for structured content
        const combinedScenes = structuredScript.visual_cues?.map((visualCue, index) => {
          const voiceoverText = editedVoiceover[index] || extractVoiceoverText(structuredScript.voiceover?.[index] || '')
          return `Scene ${index + 1} (${extractTimeRange(visualCue)}): [Visual] ${extractVisualDescription(visualCue)}\n[Audio] ${voiceoverText}`
        }) || []

        finalScript = combinedScenes.join('\n\n')
      }

      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: finalScript,
          imageUrls: selectedImages,
          aspectRatio: ugcContent?.aspect_ratio || 'portrait',
          title: productTitle,
          description: productDescription,
          ugcContent: ugcContent,
          structuredScript: structuredScript,
          style,
          duration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        toast.dismiss(toastId)
        if (response.status === 402) {
          toast.error('Insufficient credits', {
            description: 'Please purchase more credits to continue.',
            action: {
              label: 'Buy Credits',
              onClick: () => router.push('/billing'),
            },
          })
        } else {
          toast.error('Failed to start video generation', {
            description: data.error || 'Please try again.',
          })
        }
        setError(data.error || 'Failed to start video generation')
        return
      }

      // Success: Clear wizard store and show success toast with action
      reset()
      toast.dismiss(toastId)
      toast.success('Generation Started!', {
        description: 'Your video is being created. This may take a moment.',
        duration: 5000,
        action: {
          label: 'View in Library',
          onClick: () => router.push('/library'),
        },
      })

      // Redirect to library after a brief delay to show the toast
      setTimeout(() => {
        router.push('/library')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start video generation'
      toast.dismiss(toastId)
      setError(errorMessage)
      toast.error('Generation Failed', {
        description: errorMessage,
      })
    } finally {
      setGenerating(false)
    }
  }

  // Calculate script length from either structured script or plain script
  const scriptLength = structuredScript
    ? editedVoiceover.join(' ').length
    : script.length

  const isScriptValid = scriptLength >= 50 && scriptLength <= 500
  const isScriptTooShort = scriptLength > 0 && scriptLength < 50
  const isScriptTooLong = scriptLength > 500
  const canGenerate = scriptLength > 0 && selectedImages.length > 0

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
              {/* Structured Script Blocks */}
              {structuredScript ? (
                <div className="space-y-4">
                  {/* Scene Blocks */}
                  {structuredScript.visual_cues?.map((visualCue, index) => {
                    const timeRange = extractTimeRange(visualCue)
                    const visualDesc = extractVisualDescription(visualCue)
                    const voiceoverText = editedVoiceover[index] || extractVoiceoverText(structuredScript.voiceover?.[index] || '')

                    return (
                      <Card key={index} className="border border-border/50">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Time Range Header */}
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{timeRange}</span>
                            </div>

                            {/* Visual Cue (Read-only) */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Eye className="w-4 h-4" />
                                <span>Director Notes</span>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground border-l-2 border-muted">
                                {visualDesc}
                              </div>
                            </div>

                            {/* Voiceover Input */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Voiceover Script
                              </label>
                              <Textarea
                                value={voiceoverText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateVoiceoverSegment(index, e.target.value)}
                                placeholder="Enter your voiceover script..."
                                className="min-h-[80px] resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {/* Text Overlays Section */}
                  {structuredScript.text_overlay && structuredScript.text_overlay.length > 0 && (
                    <Card className="border border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Text Overlays</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {structuredScript.text_overlay.map((overlay, index) => (
                            <div key={index} className="p-3 bg-muted/20 rounded-md border">
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">
                                  {extractTimeRange(overlay)}:
                                </span>
                                <span className="ml-2">
                                  {extractVisualDescription(overlay)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                /* Fallback to textarea for backward compatibility */
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
              )}

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
