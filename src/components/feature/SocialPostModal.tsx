'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Send, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialPostModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  videoDescription: string
  onPost: (data: {
    videoId: string
    platforms: string[]
    caption: string
    tags: string[]
  }) => Promise<{ success: boolean; error?: string }>
}

// Platform-specific character limits
const PLATFORM_LIMITS = {
  TIKTOK: 2200,
  YOUTUBE: 5000,
  INSTAGRAM: 2200,
}

export function SocialPostModal({
  isOpen,
  onClose,
  videoId,
  videoDescription,
  onPost,
}: SocialPostModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Initialize caption with video description
  useEffect(() => {
    if (videoDescription && !caption) {
      setCaption(videoDescription)
    }
  }, [videoDescription, caption])

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handle platform selection
  const handlePlatformToggle = (platform: string, checked: boolean) => {
    setSelectedPlatforms(prev =>
      checked
        ? [...prev, platform]
        : prev.filter(p => p !== platform)
    )
  }

  // Get character count for caption
  const captionLength = caption.length

  // Get minimum character limit among selected platforms
  const minLimit = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map(p => PLATFORM_LIMITS[p as keyof typeof PLATFORM_LIMITS]))
    : Infinity

  // Check if caption exceeds limits for any selected platform
  const hasExceededLimit = selectedPlatforms.some(platform =>
    captionLength > PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]
  )

  // Check if caption is too short for any selected platform
  const hasMinimumLength = selectedPlatforms.length === 0 || captionLength >= 50

  // Parse hashtags from input
  const parseHashtags = (input: string): string[] => {
    return input
      .split(/[\s,]+/)
      .filter(tag => tag.startsWith('#') && tag.length > 1)
      .map(tag => tag.slice(1)) // Remove # prefix
  }

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) {
      showToast('Please select at least one platform to post to', 'error')
      return
    }

    if (!hasMinimumLength) {
      showToast('Caption must be at least 50 characters', 'error')
      return
    }

    if (hasExceededLimit) {
      showToast('Caption exceeds character limit for selected platforms', 'error')
      return
    }

    setIsPosting(true)
    try {
      const result = await onPost({
        videoId,
        platforms: selectedPlatforms,
        caption: caption.trim(),
        tags: parseHashtags(hashtags),
      })

      if (result.success) {
        showToast('Video posted successfully!', 'success')
        // Reset form and close modal after a brief delay
        setTimeout(() => {
          setSelectedPlatforms([])
          setCaption('')
          setHashtags('')
          onClose()
        }, 1000)
      } else {
        showToast(result.error || 'Failed to post video', 'error')
      }
    } catch (error) {
      console.error('Error posting to social media:', error)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsPosting(false)
    }
  }

  const platforms = [
    { id: 'TIKTOK', name: 'TikTok', icon: '🎵', color: 'text-pink-400' },
    { id: 'YOUTUBE', name: 'YouTube', icon: '📺', color: 'text-red-400' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📸', color: 'text-purple-400' },
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-[#161B22] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Share Video to Social Media
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white">Select Platforms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer",
                      selectedPlatforms.includes(platform.id)
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-border hover:border-border/70 bg-[#1F2937]"
                    )}
                    onClick={() => handlePlatformToggle(platform.id, !selectedPlatforms.includes(platform.id))}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked === true)}
                      className="data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                    />
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-medium text-white">{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Caption Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="caption" className="text-sm font-medium text-white">
                  Caption
                </Label>
                <div className="flex items-center gap-2">
                  {selectedPlatforms.length > 0 && (
                    <Badge
                      variant={hasExceededLimit ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {captionLength}/{minLimit}
                    </Badge>
                  )}
                  {hasExceededLimit && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a compelling caption for your video..."
                className="min-h-[120px] bg-[#1F2937] border-border text-white placeholder:text-muted-foreground resize-none"
                disabled={isPosting}
              />
              <div className="flex flex-wrap gap-1">
                {selectedPlatforms.map(platform => (
                  <Badge
                    key={platform}
                    variant="outline"
                    className="text-xs border-border text-muted-foreground"
                  >
                    {platform}: max {PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]} chars
                  </Badge>
                ))}
              </div>
            </div>

            {/* Hashtags Input */}
            <div className="space-y-2">
              <Label htmlFor="hashtags" className="text-sm font-medium text-white">
                Hashtags (Optional)
              </Label>
              <Textarea
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#viral #video #content (separate with spaces or commas)"
                className="min-h-[60px] bg-[#1F2937] border-border text-white placeholder:text-muted-foreground resize-none"
                disabled={isPosting}
              />
              <p className="text-xs text-muted-foreground">
                Add hashtags to increase discoverability. They will be appended to your caption.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPosting}
                className="border-border hover:bg-[#1F2937]"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePost}
                disabled={
                  isPosting ||
                  selectedPlatforms.length === 0 ||
                  !hasMinimumLength ||
                  hasExceededLimit
                }
                className="bg-[#6366F1] hover:bg-[#5855EB] disabled:opacity-50"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-[100] p-4 rounded-md shadow-lg border transition-all animate-in slide-in-from-top-5',
            toast.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
          )}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </>
  )
}
