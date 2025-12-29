'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ModelPrompt, ModelPromptInsert } from '@/types/model-prompts'
import { createModelPrompt, updateModelPrompt } from '@/app/actions/admin'

interface PromptEditDialogProps {
  prompt?: ModelPrompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STYLE_OPTIONS = [
  { value: 'ugc_auth', label: 'UGC Authenticité' },
  { value: 'green_screen', label: 'Green Screen React' },
  { value: 'pas_framework', label: 'PAS Framework' },
  { value: 'asmr_visual', label: 'ASMR Visual' },
  { value: 'before_after', label: 'Before/After' },
  { value: 'storyboard', label: 'Storyboard' },
]

const DURATION_OPTIONS = [
  { value: '10s', label: '10 seconds' },
  { value: '15s', label: '15 seconds' },
  { value: '25s', label: '25 seconds' },
  { value: '30s', label: '30 seconds' },
]

const MODEL_OPTIONS = [
  { value: 'sora-2-text-to-video', label: 'Sora 2 Text-to-Video' },
  { value: 'sora-2-pro', label: 'Sora 2 Pro Storyboard' },
  { value: 'kling-2.6', label: 'Kling 2.6' },
  { value: 'wan-2.6', label: 'Wan 2.6' },
  { value: 'hailuo-2.3', label: 'Hailuo 2.3 Pro' },
  { value: 'veo-3.1-quality', label: 'Veo 3.1 Quality' },
]

export function PromptEditDialog({ prompt, open, onOpenChange }: PromptEditDialogProps) {
  const isEditing = !!prompt
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Form state
  const [formData, setFormData] = useState<ModelPromptInsert>({
    model_id: '',
    model_name: '',
    kie_api_model_name: '',
    style: 'ugc_auth',
    duration: '15s',
    system_prompt: '',
    negative_prompts: [],
    quality_instructions: null,
    guidelines: null,
    model_config: null,
    is_active: true,
  })

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditing && prompt) {
        setFormData({
          model_id: prompt.model_id,
          model_name: prompt.model_name,
          kie_api_model_name: prompt.kie_api_model_name,
          style: prompt.style,
          duration: prompt.duration,
          system_prompt: prompt.system_prompt,
          negative_prompts: prompt.negative_prompts,
          quality_instructions: prompt.quality_instructions,
          guidelines: prompt.guidelines,
          model_config: prompt.model_config,
          is_active: prompt.is_active,
        })
      } else {
        // Reset for create mode
        setFormData({
          model_id: '',
          model_name: '',
          kie_api_model_name: '',
          style: 'ugc_auth',
          duration: '15s',
          system_prompt: '',
          negative_prompts: [],
          quality_instructions: null,
          guidelines: null,
          model_config: null,
          is_active: true,
        })
      }
      setErrors({})
    }
  }, [open, prompt, isEditing])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.model_id) newErrors.model_id = 'Model ID is required'
    if (!formData.model_name) newErrors.model_name = 'Model name is required'
    if (!formData.kie_api_model_name) newErrors.kie_api_model_name = 'KIE API model name is required'
    if (!formData.system_prompt || formData.system_prompt.length < 50) {
      newErrors.system_prompt = 'System prompt must be at least 50 characters'
    }

    // Validate JSON fields if provided
    if (formData.guidelines) {
      try {
        JSON.parse(JSON.stringify(formData.guidelines))
      } catch {
        newErrors.guidelines = 'Invalid JSON format'
      }
    }

    if (formData.model_config) {
      try {
        JSON.parse(JSON.stringify(formData.model_config))
      } catch {
        newErrors.model_config = 'Invalid JSON format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      let result
      if (isEditing && prompt) {
        result = await updateModelPrompt(prompt.id, formData)
      } else {
        result = await createModelPrompt(formData)
      }

      if (result.prompt) {
        showToast(`The model prompt has been ${isEditing ? 'updated' : 'created'} successfully.`, 'success')
        onOpenChange(false)
      } else {
        showToast(result.error || `Failed to ${isEditing ? 'update' : 'create'} prompt`, 'error')
      }
    } catch (error) {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormField = (field: keyof ModelPromptInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleNegativePromptsChange = (value: string) => {
    const prompts = value.split('\n').filter(p => p.trim())
    updateFormField('negative_prompts', prompts)
  }

  const handleJsonFieldChange = (field: 'guidelines' | 'model_config', value: string) => {
    try {
      const parsed = value.trim() ? JSON.parse(value) : null
      updateFormField(field, parsed)
    } catch {
      // Keep as string for now, will be validated on submit
      updateFormField(field, value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Model Prompt' : 'Create New Model Prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the model prompt configuration.'
              : 'Create a new model prompt for video generation.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model_id">Model ID *</Label>
              <Select
                value={formData.model_id}
                onValueChange={(value) => updateFormField('model_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.model_id && (
                <p className="text-sm text-destructive">{errors.model_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kie_api_model_name">KIE API Model Name *</Label>
              <Input
                id="kie_api_model_name"
                value={formData.kie_api_model_name}
                onChange={(e) => updateFormField('kie_api_model_name', e.target.value)}
                placeholder="e.g., sora-2-pro-text-to-video"
              />
              {errors.kie_api_model_name && (
                <p className="text-sm text-destructive">{errors.kie_api_model_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name *</Label>
            <Input
              id="model_name"
              value={formData.model_name}
              onChange={(e) => updateFormField('model_name', e.target.value)}
              placeholder="e.g., Sora 2 Text-to-Video"
            />
            {errors.model_name && (
              <p className="text-sm text-destructive">{errors.model_name}</p>
            )}
          </div>

          {/* Style and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Style *</Label>
              <Select
                value={formData.style}
                onValueChange={(value) => updateFormField('style', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => updateFormField('duration', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => updateFormField('system_prompt', e.target.value)}
              placeholder="Enter the system prompt for this model..."
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {formData.system_prompt.length} characters (minimum 50)
            </p>
            {errors.system_prompt && (
              <p className="text-sm text-destructive">{errors.system_prompt}</p>
            )}
          </div>

          {/* Negative Prompts */}
          <div className="space-y-2">
            <Label htmlFor="negative_prompts">Negative Prompts</Label>
            <Textarea
              id="negative_prompts"
              value={formData.negative_prompts?.join('\n') || ''}
              onChange={(e) => handleNegativePromptsChange(e.target.value)}
              placeholder="One negative prompt per line..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.negative_prompts?.length || 0} prompts
            </p>
          </div>

          {/* Quality Instructions */}
          <div className="space-y-2">
            <Label htmlFor="quality_instructions">Quality Instructions</Label>
            <Textarea
              id="quality_instructions"
              value={formData.quality_instructions || ''}
              onChange={(e) => updateFormField('quality_instructions', e.target.value)}
              placeholder="Quality instructions for this model..."
              rows={2}
            />
          </div>

          {/* Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="guidelines">Guidelines (JSON)</Label>
            <Textarea
              id="guidelines"
              value={formData.guidelines ? JSON.stringify(formData.guidelines, null, 2) : ''}
              onChange={(e) => handleJsonFieldChange('guidelines', e.target.value)}
              placeholder='{"critical_rules": ["rule1", "rule2"]}'
              rows={4}
              className="font-mono text-sm"
            />
            {errors.guidelines && (
              <p className="text-sm text-destructive">{errors.guidelines}</p>
            )}
          </div>

          {/* Model Config */}
          <div className="space-y-2">
            <Label htmlFor="model_config">Model Config (JSON)</Label>
            <Textarea
              id="model_config"
              value={formData.model_config ? JSON.stringify(formData.model_config, null, 2) : ''}
              onChange={(e) => handleJsonFieldChange('model_config', e.target.value)}
              placeholder='{"pricing": {"perSecond": 0.015}, "maxDuration": 10}'
              rows={4}
              className="font-mono text-sm"
            />
            {errors.model_config && (
              <p className="text-sm text-destructive">{errors.model_config}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateFormField('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditing ? 'Update Prompt' : 'Create Prompt')}
            </Button>
          </DialogFooter>
        </form>

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
