'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWizardStore } from '@/store/useWizardStore'
import { SUPPORTED_LANGUAGES, getLanguageName } from '@/lib/languages'
import { UserCheck, MonitorPlay, AlertTriangle, Sparkles, FlipHorizontal, Film } from 'lucide-react'

interface StyleOption {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description10s: string
  description15s: string
  description25s?: string
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'ugc_auth',
    title: 'UGC',
    icon: UserCheck,
    description10s: 'Stop the scroll instantly',
    description15s: 'Build trust through authentic reviews',
  },
  {
    id: 'green_screen',
    title: 'Green Screen',
    icon: MonitorPlay,
    description10s: 'Hook with impossible visuals',
    description15s: 'Tell compelling stories with effects',
  },
  {
    id: 'pas_framework',
    title: 'PAS',
    icon: AlertTriangle,
    description10s: 'Identify the problem fast',
    description15s: 'Build desire through storytelling',
  },
  {
    id: 'asmr_visual',
    title: 'ASMR',
    icon: Sparkles,
    description10s: 'Create instant curiosity',
    description15s: 'Relax and educate your audience',
  },
  {
    id: 'before_after',
    title: 'Before/After',
    icon: FlipHorizontal,
    description10s: 'Show transformation instantly',
    description15s: 'Demonstrate results over time',
  },
  {
    id: 'storyboard',
    title: 'Storyboard',
    icon: Film,
    description10s: '', // Not applicable for 10s
    description15s: '', // Not applicable for 15s
    description25s: 'Create cinematic narratives',
  },
]

export default function StyleSelector() {
  const { style, duration, language, setStyle, setDuration, setLanguage } = useWizardStore()

  const handleDurationChange = (value: string) => {
    // Auto-lock to 25s when storyboard is selected
    if (style === 'storyboard') {
      setDuration('25s')
      return
    }
    setDuration(value as '10s' | '15s' | '25s')
  }

  const handleStyleSelect = (styleId: string) => {
    setStyle(styleId)
    // Auto-lock to 25s when storyboard is selected
    if (styleId === 'storyboard') {
      setDuration('25s')
    }
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
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
              disabled={style === 'storyboard'}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
            >
              10 Seconds - Viral Hook
            </TabsTrigger>
            <TabsTrigger
              value="15s"
              disabled={style === 'storyboard'}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
            >
              15 Seconds - Storytelling
            </TabsTrigger>
            <TabsTrigger
              value="25s"
              disabled={style !== 'storyboard'}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50"
            >
              25 Seconds - Cinematic Narrative
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Language Selector */}
      <div className="flex justify-center">
        <div className="w-full max-w-md space-y-2">
          <label htmlFor="language-select" className="text-sm font-medium text-center block">
            Target Language
          </label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="w-full bg-layer-2 border-border">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName ? `${lang.name} (${lang.nativeName})` : lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STYLE_OPTIONS.map((option) => {
          const IconComponent = option.icon
          const isSelected = style === option.id
          // Handle description based on duration, with special case for storyboard
          let description = ''
          if (option.id === 'storyboard') {
            description = option.description25s || 'Create cinematic narratives'
          } else {
            description = duration === '10s' ? option.description10s : option.description15s
          }

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
                  <div className="relative">
                    <div className={`p-3 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-layer-3'
                    }`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    {option.id === 'storyboard' && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        PRO
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {option.id === 'storyboard' ? 'Storyboard Narrative' : option.title}
                    </h3>
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
