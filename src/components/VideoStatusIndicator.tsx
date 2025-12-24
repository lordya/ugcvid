'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { VideoPost } from '@/app/actions/video-posts'

interface VideoStatusIndicatorProps {
  videoPosts: VideoPost[]
  onRetry?: (videoPostId: string) => void
  isRetrying?: boolean
}

const PLATFORM_CONFIG = {
  TIKTOK: {
    name: 'TikTok',
    icon: '🎵',
    color: 'text-pink-400',
  },
  YOUTUBE: {
    name: 'YouTube',
    icon: '📺',
    color: 'text-red-400',
  },
  INSTAGRAM: {
    name: 'Instagram',
    icon: '📸',
    color: 'text-purple-400',
  },
}

export function VideoStatusIndicator({ videoPosts, onRetry, isRetrying }: VideoStatusIndicatorProps) {
  const [retryingPostId, setRetryingPostId] = useState<string | null>(null)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)

  const handleRetry = async (videoPostId: string) => {
    if (!onRetry) return

    setRetryingPostId(videoPostId)
    try {
      await onRetry(videoPostId)
    } finally {
      setRetryingPostId(null)
    }
  }

  const getStatusIcon = (status: VideoPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
      default:
        return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
    }
  }

  const getStatusColor = (status: VideoPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500/20 border-green-500/30'
      case 'FAILED':
        return 'bg-red-500/20 border-red-500/30'
      case 'PENDING':
      default:
        return 'bg-amber-500/20 border-amber-500/30'
    }
  }

  const getStatusText = (status: VideoPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Published'
      case 'FAILED':
        return 'Failed'
      case 'PENDING':
      default:
        return 'Processing'
    }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Group video posts by platform for display
  const postsByPlatform = videoPosts.reduce((acc, post) => {
    // We need to get the platform from the integration
    // For now, we'll use a placeholder - in real implementation we'd join with user_integrations
    const platform = post.integration_id as any // This will be enhanced when we add the join
    if (!acc[platform]) {
      acc[platform] = []
    }
    acc[platform].push(post)
    return acc
  }, {} as Record<string, VideoPost[]>)

  return (
    <div className="flex items-center gap-1 relative">
      {Object.entries(postsByPlatform).map(([platform, posts]) => {
        // For now, show the most recent post for each platform
        const latestPost = posts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
        const isRetryingThis = retryingPostId === latestPost.id

        return (
          <div key={platform} className="relative group">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors cursor-help',
                getStatusColor(latestPost.status)
              )}
              onMouseEnter={() => setHoveredPostId(latestPost.id)}
              onMouseLeave={() => setHoveredPostId(null)}
            >
              <span className="text-sm">{platformConfig?.icon || '📱'}</span>
              {getStatusIcon(latestPost.status)}
            </div>

            {/* Tooltip */}
            {hoveredPostId === latestPost.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 text-white text-xs rounded-md shadow-lg border border-gray-700 p-3 max-w-xs whitespace-normal">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{platformConfig?.icon}</span>
                      <span className="font-medium">{platformConfig?.name || platform}</span>
                      <Badge
                        variant={latestPost.status === 'PUBLISHED' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {getStatusText(latestPost.status)}
                      </Badge>
                    </div>

                    {latestPost.status === 'PUBLISHED' && latestPost.posted_at && (
                      <p className="text-xs text-gray-300">
                        Posted {formatTimestamp(latestPost.posted_at)}
                      </p>
                    )}

                    {/* Analytics Display */}
                    {latestPost.status === 'PUBLISHED' && latestPost.analytics_last_updated && (
                      <div className="space-y-1 pt-1 border-t border-gray-600">
                        <p className="text-xs text-gray-400">Analytics</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-blue-400">
                              {latestPost.view_count?.toLocaleString() || '0'}
                            </div>
                            <div className="text-gray-500">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-400">
                              {latestPost.like_count?.toLocaleString() || '0'}
                            </div>
                            <div className="text-gray-500">Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-400">
                              {latestPost.share_count?.toLocaleString() || '0'}
                            </div>
                            <div className="text-gray-500">Shares</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Updated {formatTimestamp(latestPost.analytics_last_updated)}
                        </p>
                      </div>
                    )}

                    {latestPost.status === 'FAILED' && latestPost.error_message && (
                      <div className="space-y-1">
                        <p className="text-xs text-red-400 font-medium">Error:</p>
                        <p className="text-xs text-gray-300">{latestPost.error_message}</p>
                      </div>
                    )}

                    {latestPost.status === 'PENDING' && (
                      <p className="text-xs text-gray-300">
                        Publishing in progress...
                      </p>
                    )}

                    {latestPost.status === 'FAILED' && onRetry && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs mt-2 border-gray-600 hover:bg-gray-800"
                        onClick={() => handleRetry(latestPost.id)}
                        disabled={isRetryingThis}
                      >
                        {isRetryingThis ? (
                          <Clock className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3 mr-1" />
                        )}
                        Retry
                      </Button>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
