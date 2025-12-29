'use client'

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModelPrompt } from '@/types/model-prompts'
import { useState } from 'react'
import { format } from 'date-fns'

interface PromptViewDialogProps {
  prompt: ModelPrompt
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PromptViewDialog({ prompt, open, onOpenChange }: PromptViewDialogProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      showToast(`${fieldName} has been copied to clipboard.`, 'success')
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      showToast('Could not copy to clipboard.', 'error')
    }
  }

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{prompt.model_name}</span>
            <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
              {prompt.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {prompt.style} • {prompt.duration} • ID: {prompt.model_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Model ID:</span>
                <p className="font-mono">{prompt.model_id}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">KIE API Name:</span>
                <p className="font-mono">{prompt.kie_api_model_name}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Style:</span>
                <p><Badge variant="outline">{prompt.style}</Badge></p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Duration:</span>
                <p><Badge variant="secondary">{prompt.duration}</Badge></p>
              </div>
            </div>
          </div>

          <Separator />

          {/* System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">System Prompt</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(prompt.system_prompt, 'System Prompt')}
              >
                {copiedField === 'System Prompt' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedField === 'System Prompt' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {prompt.system_prompt}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {prompt.system_prompt.length} characters
            </p>
          </div>

          <Separator />

          {/* Negative Prompts */}
          {prompt.negative_prompts && prompt.negative_prompts.length > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Negative Prompts</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard((prompt.negative_prompts || []).join('\n'), 'Negative Prompts')}
                  >
                    {copiedField === 'Negative Prompts' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedField === 'Negative Prompts' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {prompt.negative_prompts.map((negativePrompt, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                      <span className="text-sm">{negativePrompt}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {prompt.negative_prompts.length} negative prompts
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Quality Instructions */}
          {prompt.quality_instructions && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Quality Instructions</h3>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">{prompt.quality_instructions}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Guidelines */}
          {prompt.guidelines && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Guidelines</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(prompt.guidelines), 'Guidelines')}
                  >
                    {copiedField === 'Guidelines' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedField === 'Guidelines' ? 'Copied!' : 'Copy JSON'}
                  </Button>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {formatJson(prompt.guidelines)}
                  </pre>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Model Config */}
          {prompt.model_config && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Model Configuration</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formatJson(prompt.model_config), 'Model Config')}
                  >
                    {copiedField === 'Model Config' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedField === 'Model Config' ? 'Copied!' : 'Copy JSON'}
                  </Button>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {formatJson(prompt.model_config)}
                  </pre>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Created:</span>
                <p>{format(new Date(prompt.created_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Last Updated:</span>
                <p>{format(new Date(prompt.updated_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Database ID:</span>
                <p className="font-mono text-xs">{prompt.id}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>
                <p>
                  <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg border p-4 shadow-lg ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
