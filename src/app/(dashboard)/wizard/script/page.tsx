'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

const PROCESSING_MESSAGES = [
  'Analyzing product...',
  'Identifying key selling points...',
  'Drafting script...',
  'Polishing content...',
]

export default function WizardScriptPage() {
  const router = useRouter()
  const { metadata, script, setScript, manualInput, setStep } = useWizardStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0])
  const [messageIndex, setMessageIndex] = useState(0)

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
      const productTitle = metadata?.title || manualInput?.title || ''
      const productDescription = metadata?.description || manualInput?.description || ''

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
  }, [script, metadata, manualInput, setScript, router])

  const handleContinue = () => {
    if (script.trim()) {
      router.push('/wizard/processing')
    }
  }

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

  // Show error state (non-blocking)
  if (error && !script) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Script Review</h1>
          <p className="text-muted-foreground">Review and edit your video script</p>
        </div>

        <Card className="bg-layer-2 border-border">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-md">
                <p className="text-sm text-warning font-medium mb-1">Failed to generate script</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  You can manually type your script below or try again.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="script-input" className="text-sm font-medium">
                  Video Script
                </label>
                <textarea
                  id="script-input"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter your video script here..."
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">
                  {script.length} characters
                </p>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!script.trim()}
                className="w-full h-12 text-base"
                size="lg"
              >
                Continue to Processing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show script review state
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Script Review</h1>
        <p className="text-muted-foreground">Review and edit your video script</p>
      </div>

      <Card className="bg-layer-2 border-border">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Product Reference */}
            {metadata && (
              <div className="space-y-2 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Product Reference
                </h3>
                <div>
                  <p className="font-medium text-lg">{metadata.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {metadata.description}
                  </p>
                </div>
              </div>
            )}

            {/* Script Editor */}
            <div className="space-y-2">
              <label htmlFor="script-input" className="text-sm font-medium">
                Video Script
              </label>
              <textarea
                id="script-input"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Your script will appear here..."
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
                rows={12}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {script.length} characters
                </p>
                {script.length < 50 && (
                  <p className="text-xs text-warning">
                    Script may be too short for a 30-second video
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!script.trim()}
              className="w-full h-12 text-base"
              size="lg"
            >
              Continue to Processing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

