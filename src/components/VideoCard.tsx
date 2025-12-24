'use client'

import { useVideoStatus, VideoStatus } from '@/hooks/useVideoStatus'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VideoStatusIndicator } from './VideoStatusIndicator'
import { VideoPost } from '@/app/actions/video-posts'
import { useState } from 'react'

interface VideoCardProps {
  videoId: string
  initialStatus: VideoStatus
  inputMetadata?: {
    title?: string
    description?: string
    images?: string[]
  } | null
  createdAt: string
  videoPosts?: VideoPost[]
  onRetryPost?: (videoPostId: string) => void
  isHighPerformer?: boolean | null
}

export function VideoCard({
  videoId,
  initialStatus,
  inputMetadata,
  createdAt,
  videoPosts = [],
  onRetryPost,
  isHighPerformer = false
}: VideoCardProps) {
  const { data, isLoading } = useVideoStatus({
    videoId,
    initialStatus,
    enabled: initialStatus === 'PROCESSING',
  })

  const [showPlayer, setShowPlayer] = useState(false)

  const status = data?.status || initialStatus
  const videoUrl = data?.videoUrl
  const errorReason = data?.errorReason

  // Get thumbnail - use first image from input metadata or placeholder
  const thumbnailUrl =
    inputMetadata?.images?.[0] ||
    'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=Video+Thumbnail'

  const isProcessing = status === 'PROCESSING'
  const isCompleted = status === 'COMPLETED'
  const isFailed = status === 'FAILED'

  return (
    <>
      <Card className="group relative overflow-hidden bg-[#161B22] border-border hover:border-primary/50 transition-all">
        <div className="relative aspect-[9/16] w-full">
          {/* Thumbnail */}
          <div
            className={`absolute inset-0 bg-cover bg-center ${
              isProcessing ? 'blur-sm brightness-75' : ''
            } transition-all`}
            style={{
              backgroundImage: `url(${thumbnailUrl})`,
            }}
          />

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-white font-medium">Generating...</p>
                {data?.progress && (
                  <p className="text-xs text-white/70 mt-1">
                    {Math.round(data.progress * 100)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isCompleted && (
              <div className="bg-green-500/90 rounded-full p-1.5 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
            {isFailed && (
              <div className="bg-red-500/90 rounded-full p-1.5 shadow-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            )}
            {isProcessing && (
              <div className="bg-amber-500/90 rounded-full p-1.5 shadow-lg animate-pulse">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
            {isCompleted && isHighPerformer && (
              <div className="bg-orange-500/90 rounded-full p-1.5 shadow-lg">
                <Flame className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Hover Overlay for Completed Videos */}
          {isCompleted && videoUrl && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                onClick={() => setShowPlayer(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Play Video
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
            {inputMetadata?.title || 'Untitled Video'}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {inputMetadata?.description || 'No description'}
          </p>

          {/* Social Status Indicator */}
          {videoPosts.length > 0 && (
            <VideoStatusIndicator
              videoPosts={videoPosts}
              onRetry={onRetryPost}
            />
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleDateString()}
          </span>
          {isFailed && (
            <span className="text-xs text-red-400">Failed • Credit Refunded</span>
          )}
          {isCompleted && (
            <span className="text-xs text-green-400">Ready</span>
          )}
        </CardFooter>
      </Card>

      {/* Video Player Modal */}
      {showPlayer && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setShowPlayer(false)}
        >
          <div
            className="relative max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPlayer(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              Close
            </button>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ aspectRatio: '9/16' }}
            />
          </div>
        </div>
      )}
    </>
  )
}

