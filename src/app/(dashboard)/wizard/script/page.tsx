'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, ScriptVariant } from '@/store/useWizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, ChevronDown, ChevronUp, RotateCcw, Eye, Clock } from 'lucide-react'
import { ScriptVariantCard } from '@/components/wizard/ScriptVariantCard'
import { ScriptAngleSelector } from '@/components/wizard/ScriptAngleSelector'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { validateStyleDuration } from '@/lib/validation'
import { getFormatKey, selectModelForFormat, calculateVideoCost, usdToCredits } from '@/lib/kie-models'
import { z } from 'zod'

// Zod schema for validating StructuredScriptContent from API
const structuredScriptContentSchema = z.object({
  style: z.string(),
  tone_instructions: z.string().optional(),
  visual_cues: z.array(z.string()),
  voiceover: z.array(z.string()),
  text_overlay: z.array(z.string()).optional(),
  music_recommendation: z.string().optional(),
  hashtags: z.string().optional(),
  background_content_suggestions: z.array(z.string()).optional(),
  audio_design: z.array(z.string()).optional(),
  pacing_and_editing: z.array(z.string()).optional(),
  lighting_and_composition: z.array(z.string()).optional(),
  color_grading: z.string().optional(),
  aspect_ratio: z.string().optional(),
  technical_directives: z.object({
    lighting: z.string().optional(),
    camera: z.string().optional(),
    consistency: z.string().optional(),
  }).optional(),
  narrative_arc: z.array(z.string()).optional(),
  cinematic_techniques: z.array(z.string()).optional(),
}).strict()

// Dynamic processing messages based on mode
const getProcessingMessages = (selectedAngle: string | null) => {
  if (selectedAngle) {
    // Single angle mode
    return [
      'Analyzing your marketing angle...',
      'Crafting the perfect script...',
      'Polishing the content...',
    ]
  } else {
    // Auto mode - generating 3 variants
    return [
      'Brainstorming angles...',
      'Analyzing product from multiple perspectives...',
      'Generating script variants...',
      'Comparing approaches...',
      'Polishing content...',
    ]
  }
}

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
    selectedAngle,
    scriptVariants,
    selectedScriptVariant,
    setSelectedAngle,
    setScriptVariants,
    selectScriptVariant,
    updateScriptVariant,
    regenerateScriptVariant,
    ugcContent,
    setUgcContent,
    structuredScript,
    setStructuredScript,
    editedVoiceover,
    setEditedVoiceover,
    updateVoiceoverSegment,
    selectedImages,
    toggleImageSelection,
    getMaxImageLimit,
    setSelectedImages,
    setStep,
    reset,
    style,
    duration,
    language,
  } = useWizardStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState('Brainstorming angles...')
  const [messageIndex, setMessageIndex] = useState(0)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const isGeneratingRef = useRef(false)
  const [scriptValidation, setScriptValidation] = useState<any>(null)
  const [regeneratingVariants, setRegeneratingVariants] = useState<Set<number>>(new Set())

  // Get product info
  const productTitle = metadata?.title || manualInput?.title || ''
  const productDescription = metadata?.description || manualInput?.description || ''
  const availableImages = metadata?.images || []
  
  // Get max image limit based on current style and duration
  const maxImageLimit = getMaxImageLimit()

  // Ensure step is set to 2 when component mounts
  useEffect(() => {
    setStep(2)
  }, [setStep])

  // Trim selected images when limit changes (style or duration change)
  useEffect(() => {
    if (selectedImages.length > maxImageLimit) {
      // Trim to the new limit, keeping the first N images
      const trimmed = selectedImages.slice(0, maxImageLimit)
      setSelectedImages(trimmed)
      toast.info(`Image selection limited to ${maxImageLimit} for this format`, {
        description: `This format supports up to ${maxImageLimit} image${maxImageLimit > 1 ? 's' : ''}.`,
        duration: 3000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxImageLimit, style, duration]) // Only run when style, duration, or maxImageLimit changes


  // Manual script generation function
  const handleGenerateScripts = async () => {
    // Prevent multiple simultaneous generations
    if (isGeneratingRef.current || loading) {
      return
    }

    // Get product title and description from metadata or manual input
    if (!productTitle || !productDescription) {
      setError('Product information is missing')
      return
    }

    isGeneratingRef.current = true
    setLoading(true)
    setError(null)
    setMessageIndex(0)
    const messages = getProcessingMessages(selectedAngle)
    setProcessingMessage(messages[0])

    // Rotate processing messages every 2 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % messages.length
        setProcessingMessage(messages[next])
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
          // Request advanced generation based on angle selection
          mode: selectedAngle ? 'single' : 'auto',
          angleId: selectedAngle || undefined,
        }),
      })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          // Special handling for JSON parsing errors - allow manual override
          if (response.status === 422 && errorData.rawContent) {
            console.warn('Script generation succeeded but JSON parsing failed - enabling manual override')
            // Create a fallback script variant for manual editing
            const fallbackVariant: ScriptVariant = {
              angle: {
                id: 'fallback',
                label: 'Manual Edit Required',
                description: 'Script generation had formatting issues',
                keywords: []
              },
              content: errorData.rawContent,
              isSelected: true
            }
            setScriptVariants([fallbackVariant])
            selectScriptVariant(fallbackVariant)
            setError(`${errorData.error || 'Script generation had formatting issues'}. The content below can be manually edited.`)
            return // Don't throw error - allow user to proceed with manual editing
          }

          throw new Error(errorData.error || 'Failed to generate script')
        }

      const data = await response.json()

      // Store validation results if provided
      if (data.validation) {
        setScriptValidation(data.validation)
      }

      // Handle advanced script generation with multiple variants
      if (data.scripts && Array.isArray(data.scripts)) {
        const scriptVariants: ScriptVariant[] = data.scripts.map((script: any, index: number) => ({
          id: script.video_script_id,
          angle: script.angle,
          content: script.content,
          confidence: script.confidence || 0.8,
          isSelected: index === 0, // Select first variant by default
        }))

        setScriptVariants(scriptVariants)

        // Don't auto-select any variant - let user choose which one to use
        // Don't set UGC content until user selects a variant
      } else if (data.scriptContent) {
        // Handle structured script content response (fallback)
        const validationResult = structuredScriptContentSchema.safeParse(data.scriptContent)

        if (validationResult.success) {
          const validatedContent = validationResult.data
          setStructuredScript(validatedContent)
          setEditedVoiceover(validatedContent.voiceover || [])

          // Create a single script variant for backward compatibility
          const scriptVariant: ScriptVariant = {
            angle: {
              id: 'legacy',
              label: 'Generated Script',
              description: validatedContent.tone_instructions || 'AI-generated script',
              keywords: []
            },
            content: validatedContent.voiceover?.join(' ') || '',
            isSelected: true
          }

          setScriptVariants([scriptVariant])
          selectScriptVariant(scriptVariant)

          setUgcContent({
            Title: validatedContent.style || 'Generated Script',
            Caption: validatedContent.voiceover?.join(' ') || '',
            Description: validatedContent.tone_instructions || '',
            Prompt: validatedContent.voiceover?.join(' ') || '',
            aspect_ratio: 'portrait'
          })
        } else {
          console.error('Invalid scriptContent structure:', validationResult.error)
          setError('Generated script has an unexpected format. Please review and edit manually.')
        }
      } else if (data.script) {
        // Backward compatibility - create single variant
        const scriptVariant: ScriptVariant = {
          angle: {
            id: 'legacy',
            label: 'Generated Script',
            description: 'AI-generated script',
            keywords: []
          },
          content: data.script,
          isSelected: true
        }

        setScriptVariants([scriptVariant])
        selectScriptVariant(scriptVariant)

        setUgcContent({
          Title: 'Generated Script',
          Caption: data.script,
          Description: '',
          Prompt: data.script,
          aspect_ratio: 'portrait'
        })
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
      isGeneratingRef.current = false
    }
  }

  const handleRegenerateScript = async () => {
    if (!productTitle || !productDescription) {
      setError('Product information is missing')
      return
    }

    setLoading(true)
    setError(null)
    setMessageIndex(0)
    const messages = getProcessingMessages(selectedAngle)
    setProcessingMessage(messages[0])

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % messages.length
        setProcessingMessage(messages[next])
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
          mode: selectedAngle ? 'single' : 'auto',
          angleId: selectedAngle || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 422 && errorData.rawContent) {
          console.warn('Script regeneration succeeded but JSON parsing failed - enabling manual override')
          setError(`${errorData.error || 'Script generation had formatting issues'}. The content below can be manually edited.`)
          return
        }

        throw new Error(errorData.error || 'Failed to regenerate script')
      }

      const data = await response.json()

      // Store validation results if provided
      if (data.validation) {
        setScriptValidation(data.validation)
      }

      if (data.scripts && Array.isArray(data.scripts)) {
        const newScriptVariants: ScriptVariant[] = data.scripts.map((script: any) => ({
          id: script.video_script_id,
          angle: script.angle,
          content: script.content,
          confidence: script.confidence || 0.8,
          isSelected: false, // Don't auto-select any variant - let user choose
        }))

        setScriptVariants(newScriptVariants)

        // Don't auto-select any variant - user must choose which one to use
      } else if (data.script) {
        // Fallback to single script
        const scriptVariant: ScriptVariant = {
          angle: {
            id: 'regenerated',
            label: 'Regenerated Script',
            description: 'AI-regenerated script',
            keywords: []
          },
          content: data.script,
          isSelected: true
        }

        setScriptVariants([scriptVariant])
        selectScriptVariant(scriptVariant)
      } else {
        throw new Error('No script returned from API')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate script'
      setError(errorMessage)
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  const handleImageToggle = (imageUrl: string) => {
    const currentSelected = selectedImages.length
    const isSelected = selectedImages.includes(imageUrl)

    if (!isSelected && currentSelected >= maxImageLimit) {
      setSelectionError(`Maximum ${maxImageLimit} image${maxImageLimit > 1 ? 's' : ''} can be selected for this format`)
      setTimeout(() => setSelectionError(null), 3000)
      return
    }

    setSelectionError(null)
    toggleImageSelection(imageUrl)
  }

  const handleSelectScriptVariant = async (variant: ScriptVariant) => {
    selectScriptVariant(variant)

    // Update database selection if variant has an ID (was saved to DB)
    if (variant.id) {
      try {
        await fetch('/api/videos/scripts/select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scriptId: variant.id,
          }),
        })
      } catch (error) {
        console.error('Failed to update script selection in database:', error)
        // Don't block the UI flow if database update fails
      }
    }
  }

  const handleEditScriptVariant = (index: number, newContent: string) => {
    updateScriptVariant(index, { content: newContent })
  }

  const handleRegenerateScriptVariant = async (index: number) => {
    if (!productTitle || !productDescription) {
      setError('Product information is missing')
      return
    }

    setRegeneratingVariants(prev => new Set([...prev, index]))

    try {
      // Generate a new script for the same angle as the current variant
      const currentVariant = scriptVariants[index]
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
          mode: 'single',
          angleId: currentVariant.angle.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate script variant')
      }

      const data = await response.json()

      if (data.scripts && Array.isArray(data.scripts) && data.scripts.length > 0) {
        // Use the first new script as replacement
        const newScript = data.scripts[0]
        const newVariant: ScriptVariant = {
          id: newScript.video_script_id,
          angle: newScript.angle,
          content: newScript.content,
          confidence: newScript.confidence || 0.8,
          isSelected: scriptVariants[index]?.isSelected || false,
        }

        regenerateScriptVariant(index, newVariant)
      }
    } catch (err) {
      console.error('Error regenerating script variant:', err)
      setError('Failed to regenerate script variant')
    } finally {
      setRegeneratingVariants(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const handleGenerateVideo = async () => {
    if ((!selectedScriptVariant?.content.trim() && !structuredScript) || selectedImages.length === 0) {
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
      let finalScript = selectedScriptVariant?.content.trim() || ''

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
          ugcContent: {
            ...ugcContent,
            Prompt: finalScript,
            Caption: finalScript,
          },
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

  // Calculate script length from selected script variant or structured script
  const scriptLength = structuredScript
    ? editedVoiceover.join(' ').length
    : selectedScriptVariant?.content.length || 0

  const isScriptValid = scriptLength >= 50 && scriptLength <= 500
  const isScriptTooShort = scriptLength > 0 && scriptLength < 50
  const isScriptTooLong = scriptLength > 500
  const canGenerate = scriptLength > 0 && selectedImages.length > 0

  // Calculate dynamic cost based on style and duration
  const format = getFormatKey(style, duration)
  const costCalculationModel = selectModelForFormat(format)
  const parsedDuration = parseInt(duration.replace('s', ''), 10)
  const costUsd = calculateVideoCost(costCalculationModel, parsedDuration)
  const costCredits = usdToCredits(costUsd)

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

  // Main Director Mode UI - Script Variants Selection
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Choose Your Creative Direction</h1>
        <p className="text-muted-foreground">Select the script variant that best fits your vision</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-md">
          <p className="text-sm text-warning font-medium mb-1">
            {error.includes('formatting issues') ? 'Script generation completed with formatting issues' : 'Script generation failed'}
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {error.includes('formatting issues')
              ? 'The AI generated content, but it needs manual formatting. Please review and edit the script below.'
              : 'You can manually edit the script below or try regenerating.'
            }
          </p>
        </div>
      )}

      {/* Selection Error Toast */}
      {selectionError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">{selectionError}</p>
        </div>
      )}

      {/* Angle Selector */}
      <ScriptAngleSelector
        selectedAngle={selectedAngle}
        onAngleChange={setSelectedAngle}
      />

      {/* Generate Scripts Button */}
      {scriptVariants.length === 0 && !loading && (
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateScripts}
            size="lg"
            className="px-8 py-3 text-lg font-semibold"
            disabled={!productTitle || !productDescription}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Scripts
          </Button>
        </div>
      )}

      {/* Script Variants Grid */}
      {scriptVariants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {scriptVariants.map((variant, index) => (
            <ScriptVariantCard
              key={variant.id || index}
              variant={variant}
              isSelected={selectedScriptVariant?.id === variant.id}
              onSelect={() => handleSelectScriptVariant(variant)}
              onEdit={(content) => handleEditScriptVariant(index, content)}
              onRegenerate={() => handleRegenerateScriptVariant(index)}
              isRegenerating={regeneratingVariants.has(index)}
            />
          ))}
        </div>
      )}

      {/* Product Reference and Image Selection */}
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
                Select Images ({selectedImages.length}/{maxImageLimit})
              </label>
              {selectedImages.length === 0 && (
                <span className="text-xs text-warning">Select at least 1 image</span>
              )}
              {selectedImages.length >= maxImageLimit && (
                <span className="text-xs text-muted-foreground">Maximum reached</span>
              )}
            </div>
            {availableImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableImages.map((imageUrl, index) => {
                  const isSelected = selectedImages.includes(imageUrl)
                  return (
                    <button
                      key={index}
                      onClick={() => handleImageToggle(imageUrl)}
                      className={cn(
                        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                        isSelected
                          ? 'border-primary opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-layer-2 scale-105'
                          : 'border-border opacity-70 hover:opacity-90 hover:border-primary/60'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Handle image load errors
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/15 flex items-center justify-center transition-all duration-200">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">✓</span>
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleRegenerateScript}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Generate New Variants
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
            `Generate Video • -${costCredits} Credit${costCredits === 1 ? '' : 's'}`
          )}
        </Button>
      </div>

      {/* Validation Hints */}
      {((!selectedScriptVariant?.content.trim() && !structuredScript) || selectedImages.length === 0) && (
        <div className="p-3 bg-layer-3 rounded-md text-xs text-muted-foreground">
          {!selectedScriptVariant?.content.trim() && !structuredScript && <p>• Select a script variant</p>}
          {selectedImages.length === 0 && <p>• Select at least 1 image</p>}
        </div>
      )}
    </div>
  )
}
