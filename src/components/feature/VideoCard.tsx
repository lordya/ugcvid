'use client'

import { useVideoStatus, VideoStatus } from '@/hooks/useVideoStatus'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { VideoPlayerModal } from './VideoPlayerModal'

interface VideoCardProps {
  video: {
    id: string
    status: VideoStatus
    video_url: string | null
    final_script: string | null
    input_metadata: {
      title?: string
      description?: string
      images?: string[]
    } | null
    created_at: string
  }
}

export function VideoCard({ video }: VideoCardProps) {
  const { data } = useVideoStatus({
    videoId: video.id,
    initialStatus: video.status,
    enabled: video.status === 'PROCESSING' || video.status === 'SCRIPT_GENERATED',
  })

  const [showPlayer, setShowPlayer] = useState(false)

  // Use the latest status from polling if available
  const status = data?.status || video.status
  const videoUrl = data?.videoUrl || video.video_url

  // Get thumbnail - use first image from input metadata or placeholder
  const thumbnailUrl =
    video.input_metadata?.images?.[0] ||
    'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=Video+Thumbnail'

  const isProcessing = status === 'PROCESSING' || status === 'SCRIPT_GENERATED'
  const isCompleted = status === 'COMPLETED'
  const isFailed = status === 'FAILED'

  const handleCardClick = () => {
    if (isCompleted && videoUrl) {
      setShowPlayer(true)
    }
  }

  return (
    <>
      <Card
        className={`group relative overflow-hidden bg-[#161B22] border-border transition-all ${
          isCompleted && videoUrl
            ? 'hover:border-primary/50 cursor-pointer'
            : 'cursor-default'
        } ${isFailed ? 'opacity-75' : ''}`}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[9/16] w-full">
          {/* Thumbnail */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all ${
              isProcessing ? 'blur-sm brightness-75' : ''
            } ${isFailed ? 'grayscale' : ''}`}
            style={{
              backgroundImage: `url(${thumbnailUrl})`,
            }}
          />

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <div className="relative mb-3">
                  <div className="h-3 w-3 bg-amber-500 rounded-full animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
                </div>
                <p className="text-sm text-white font-medium">Generating...</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {isCompleted && (
              <div className="bg-[#10B981]/90 rounded-full p-1.5 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
            {isFailed && (
              <div className="bg-[#EF4444]/90 rounded-full p-1.5 shadow-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            )}
            {isProcessing && (
              <div className="bg-[#F59E0B]/90 rounded-full p-1.5 shadow-lg animate-pulse">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Hover Overlay for Completed Videos */}
          {isCompleted && videoUrl && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <Play className="h-6 w-6" />
                <span className="text-sm font-medium">Play</span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
            {video.input_metadata?.title || 'Untitled Video'}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {video.input_metadata?.description || 'No description'}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(video.created_at).toLocaleDateString()}
          </span>
          {isFailed && (
            <span className="text-xs text-[#EF4444]">Failed • Refunded</span>
          )}
          {isCompleted && (
            <span className="text-xs text-[#10B981]">Ready</span>
          )}
        </CardFooter>
      </Card>

      {/* Video Player Modal */}
      {showPlayer && videoUrl && (
        <VideoPlayerModal
          videoUrl={videoUrl}
          videoId={video.id}
          script={video.final_script || ''}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  )
}

