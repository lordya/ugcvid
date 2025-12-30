'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, Edit3, RotateCcw, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScriptVariant } from '@/store/useWizardStore'

interface ScriptVariantCardProps {
  variant: ScriptVariant
  isSelected: boolean
  onSelect: () => void
  onEdit: (content: string) => void
  onRegenerate: () => void
  isRegenerating?: boolean
  index: number
}

export function ScriptVariantCard({
  variant,
  isSelected,
  onSelect,
  onEdit,
  onRegenerate,
  isRegenerating = false,
  index
}: ScriptVariantCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(variant.content)

  const handleSelect = useCallback(() => {
    onSelect()
  }, [onSelect])

  const handleStartEdit = useCallback(() => {
    setEditContent(variant.content)
    setIsEditing(true)
  }, [variant.content])

  const handleSaveEdit = useCallback(() => {
    onEdit(editContent)
    setIsEditing(false)
  }, [onEdit, editContent])

  const handleCancelEdit = useCallback(() => {
    setEditContent(variant.content)
    setIsEditing(false)
  }, [variant.content])

  const handleRegenerate = useCallback(() => {
    onRegenerate()
  }, [onRegenerate])

  return (
    <Card className={cn(
      'relative h-full transition-all duration-200 flex flex-col',
      'hover:shadow-lg hover:scale-[1.02]',
      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.02]'
    )}>
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-medium truncate max-w-[120px]">
            {variant.angle.label}
          </Badge>
          {isSelected && (
            <Badge variant="default" className="text-xs font-medium bg-primary">
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between min-h-0 space-y-4">
        {/* Script Content */}
        <div className="flex-1 min-h-0">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your script..."
              className="min-h-[140px] resize-none text-sm font-mono"
              rows={8}
            />
          ) : (
            <div className="p-4 bg-muted/30 rounded-md min-h-[140px] max-h-[200px] overflow-y-auto border">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {variant.content || 'No script content available'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 space-y-3">
          {!isEditing ? (
            <>
              {/* Main Select Button */}
              <Button
                onClick={handleSelect}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full h-10 text-sm font-medium transition-all",
                  isSelected && "bg-primary hover:bg-primary/90 shadow-md"
                )}
              >
                {isSelected ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Deselect This Script
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Select This Script
                  </>
                )}
              </Button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleStartEdit}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  size="sm"
                  disabled={isRegenerating}
                  className="h-8 text-xs"
                >
                  {isRegenerating ? (
                    <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3 mr-1" />
                  )}
                  Try Another
                </Button>
              </div>
            </>
          ) : (
            /* Edit Mode Buttons */
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                className="flex-1 h-8 text-sm bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1 h-8 text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}

          {/* Angle Description */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {variant.angle.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
