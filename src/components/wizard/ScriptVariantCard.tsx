'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, Edit3, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScriptVariant } from '@/store/useWizardStore'

interface ScriptVariantCardProps {
  variant: ScriptVariant
  isSelected: boolean
  onSelect: () => void
  onEdit: (content: string) => void
  onRegenerate: () => void
  isRegenerating?: boolean
}

export function ScriptVariantCard({
  variant,
  isSelected,
  onSelect,
  onEdit,
  onRegenerate,
  isRegenerating = false
}: ScriptVariantCardProps) {
  const [isEditing, setIsEditing] = useState(variant.isEditing || false)
  const [editContent, setEditContent] = useState(variant.content)

  const handleSaveEdit = () => {
    onEdit(editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(variant.content)
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {variant.angle.label}
          </Badge>
          {isSelected && (
            <Badge variant="default" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Script Content */}
        <div className="space-y-2">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your script..."
              className="min-h-[120px] resize-none"
              rows={6}
            />
          ) : (
            <div className="p-3 bg-muted/30 rounded-md min-h-[120px]">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {variant.content}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!isEditing ? (
            <>
              <Button
                onClick={onSelect}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select This Script'
                )}
              </Button>

              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Button
                onClick={onRegenerate}
                variant="outline"
                size="sm"
                disabled={isRegenerating}
                className="flex-1"
              >
                {isRegenerating ? (
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Try Another
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                size="sm"
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Angle Description */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Angle:</strong> {variant.angle.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
