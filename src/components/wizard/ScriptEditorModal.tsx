'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, RotateCcw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ScriptEditorModalProps {
  item: BatchItemStatus | null
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, newScript: string) => Promise<void>
}

const MAX_SCRIPT_LENGTH = 500
const MIN_SCRIPT_LENGTH = 50

export function ScriptEditorModal({ item, isOpen, onClose, onSave }: ScriptEditorModalProps) {
  const [script, setScript] = useState('')
  const [originalScript, setOriginalScript] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize script when item changes
  useEffect(() => {
    if (item?.script) {
      setScript(item.script)
      setOriginalScript(item.script)
    } else {
      setScript('')
      setOriginalScript('')
    }
    setError(null)
  }, [item])

  const handleSave = async () => {
    if (!item) return

    // Validation
    if (script.length < MIN_SCRIPT_LENGTH) {
      setError(`Script must be at least ${MIN_SCRIPT_LENGTH} characters long`)
      return
    }

    if (script.length > MAX_SCRIPT_LENGTH) {
      setError(`Script must be no more than ${MAX_SCRIPT_LENGTH} characters long`)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(item.id, script)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save script')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setScript(originalScript)
    setError(null)
  }

  const handleClose = () => {
    // Reset to original script if user cancels
    setScript(originalScript)
    setError(null)
    onClose()
  }

  const scriptLength = script.length
  const isValidLength = scriptLength >= MIN_SCRIPT_LENGTH && scriptLength <= MAX_SCRIPT_LENGTH
  const hasChanges = script !== originalScript

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-layer-2 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Script - Row {item.rowIndex}</span>
            <Badge variant="outline" className="ml-2">
              {item.url}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Product Information */}
          <div className="bg-layer-3 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-3">Product Information</h3>
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

          {/* Script Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Script Content</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {scriptLength} / {MAX_SCRIPT_LENGTH} characters
                </span>
                <Badge
                  variant={isValidLength ? "default" : "destructive"}
                  className={cn(
                    "text-xs",
                    isValidLength ? "bg-success/10 text-success" : ""
                  )}
                >
                  {isValidLength ? "Valid" : "Invalid"}
                </Badge>
              </div>
            </div>

            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script content here..."
              className="min-h-[200px] font-mono text-sm bg-layer-1 border-border"
              disabled={isSaving}
            />

            {/* Character count bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum: {MIN_SCRIPT_LENGTH}</span>
                <span>Maximum: {MAX_SCRIPT_LENGTH}</span>
              </div>
              <div className="w-full bg-layer-3 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    scriptLength < MIN_SCRIPT_LENGTH
                      ? "bg-warning"
                      : scriptLength > MAX_SCRIPT_LENGTH
                      ? "bg-destructive"
                      : "bg-success"
                  )}
                  style={{
                    width: `${Math.min((scriptLength / MAX_SCRIPT_LENGTH) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Change Indicator */}
          {hasChanges && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !isValidLength || isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
