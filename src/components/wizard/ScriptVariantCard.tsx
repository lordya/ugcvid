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
      'h-full transition-all duration-200 hover:shadow-md flex flex-col',
      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-medium">
            {variant.angle.label}
          </Badge>
          {isSelected && (
            <Badge variant="default" className="text-xs font-medium">
              <Check className="w-3 h-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between min-h-0">
        {/* Script Content - Takes available space */}
        <div className="flex-shrink-0 space-y-2 mb-4">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your script..."
              className="min-h-[140px] resize-none text-sm"
              rows={8}
            />
          ) : (
            <div className="p-4 bg-muted/30 rounded-md min-h-[140px] max-h-[200px] overflow-y-auto">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {variant.content}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section - Buttons and Description */}
        <div className="flex-shrink-0 space-y-3 mt-auto">
          {/* Action Buttons */}
          <div className="space-y-2">
            {!isEditing ? (
              <>
                <Button
                  onClick={onSelect}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full h-9 text-sm font-medium",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
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
                    onClick={onRegenerate}
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
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 h-8 text-sm"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1 h-8 text-sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Angle Description */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Angle:</strong> {variant.angle.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
