'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWizardStore } from '@/store/useWizardStore'
import { UserCheck, MonitorPlay, AlertTriangle, Sparkles, FlipHorizontal } from 'lucide-react'

interface StyleOption {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description10s: string
  description30s: string
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'ugc',
    title: 'UGC',
    icon: UserCheck,
    description10s: 'Stop the scroll instantly',
    description30s: 'Build trust through authentic reviews',
  },
  {
    id: 'green_screen',
    title: 'Green Screen',
    icon: MonitorPlay,
    description10s: 'Hook with impossible visuals',
    description30s: 'Tell compelling stories with effects',
  },
  {
    id: 'pas',
    title: 'PAS',
    icon: AlertTriangle,
    description10s: 'Identify the problem fast',
    description30s: 'Build desire through storytelling',
  },
  {
    id: 'asmr',
    title: 'ASMR',
    icon: Sparkles,
    description10s: 'Create instant curiosity',
    description30s: 'Relax and educate your audience',
  },
  {
    id: 'before_after',
    title: 'Before/After',
    icon: FlipHorizontal,
    description10s: 'Show transformation instantly',
    description30s: 'Demonstrate results over time',
  },
]

export default function StyleSelector() {
  const { style, duration, setStyle, setDuration } = useWizardStore()

  const handleDurationChange = (value: string) => {
    setDuration(value as '10s' | '30s')
  }

  const handleStyleSelect = (styleId: string) => {
    setStyle(styleId)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Choose Your Creative Strategy</h2>
        <p className="text-muted-foreground">
          Select a video style and duration that matches your platform strategy
        </p>
      </div>

      {/* Duration Toggle */}
      <div className="flex justify-center">
        <Tabs value={duration} onValueChange={handleDurationChange}>
          <TabsList className="bg-layer-3 border border-border">
            <TabsTrigger
              value="10s"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              10 Seconds - Viral Hook
            </TabsTrigger>
            <TabsTrigger
              value="30s"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              30 Seconds - Storytelling
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STYLE_OPTIONS.map((option) => {
          const IconComponent = option.icon
          const isSelected = style === option.id
          const description = duration === '10s' ? option.description10s : option.description30s

          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-layer-3'
              }`}
              onClick={() => handleStyleSelect(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-layer-3'
                  }`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
