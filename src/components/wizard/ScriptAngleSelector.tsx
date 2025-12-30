'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Target, Heart, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AngleOption {
  id: string
  label: string
  description: string
  category?: 'logical' | 'emotional' | 'viral'
  isDefault?: boolean
}

interface ScriptAngleSelectorProps {
  selectedAngle: string | null
  onAngleChange: (angleId: string | null) => void
  className?: string
}

const DEFAULT_ANGLES: AngleOption[] = [
  {
    id: 'auto',
    label: 'Auto / Generate 3 Variations',
    description: 'Let AI choose the best 3 marketing angles for your product',
    category: 'logical',
    isDefault: true
  }
]

// Angle categories with icons
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'logical':
      return <Target className="w-4 h-4" />
    case 'emotional':
      return <Heart className="w-4 h-4" />
    case 'viral':
      return <TrendingUp className="w-4 h-4" />
    default:
      return <Sparkles className="w-4 h-4" />
  }
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'logical':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'emotional':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'viral':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-purple-100 text-purple-800 border-purple-200'
  }
}

export function ScriptAngleSelector({
  selectedAngle,
  onAngleChange,
  className
}: ScriptAngleSelectorProps) {
  const [availableAngles, setAvailableAngles] = useState<AngleOption[]>(DEFAULT_ANGLES)
  const [loading, setLoading] = useState(true)

  // Fetch available angles from the database
  useEffect(() => {
    const fetchAngles = async () => {
      try {
        const response = await fetch('/api/script-angles')
        if (response.ok) {
          const angles = await response.json()
          const angleOptions: AngleOption[] = angles.map((angle: any) => ({
            id: angle.id,
            label: angle.label,
            description: angle.description,
            category: angle.category || 'logical' // Default category if not specified
          }))

          setAvailableAngles([...DEFAULT_ANGLES, ...angleOptions])
        }
      } catch (error) {
        console.warn('Failed to fetch script angles, using defaults:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAngles()
  }, [])

  const selectedAngleOption = availableAngles.find(angle => angle.id === selectedAngle)

  return (
    <Card className={cn('bg-layer-2 border-border', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" />
          Choose Your Marketing Angle
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a specific marketing approach or let AI generate multiple options
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Marketing Strategy</label>
          <Select
            value={selectedAngle || 'auto'}
            onValueChange={(value) => onAngleChange(value === 'auto' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select marketing angle..." />
            </SelectTrigger>
            <SelectContent>
              {availableAngles.map((angle) => (
                <SelectItem key={angle.id} value={angle.id}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(angle.category)}
                    <span>{angle.label}</span>
                    {angle.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAngleOption && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-full border',
                getCategoryColor(selectedAngleOption.category)
              )}>
                {getCategoryIcon(selectedAngleOption.category)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{selectedAngleOption.label}</h4>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', getCategoryColor(selectedAngleOption.category))}
                  >
                    {selectedAngleOption.category || 'Strategy'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAngleOption.description}
                </p>
                {selectedAngleOption.id === 'auto' && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Pro tip:</strong> Auto mode generates 3 different marketing angles
                      (Logical, Emotional, and Viral) so you can choose the best approach for your audience.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Angle Types:</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600" />
              <span>Logical - Facts & Benefits</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-600" />
              <span>Emotional - Feelings & Stories</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-600" />
              <span>Viral - Shareable & Trendy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
