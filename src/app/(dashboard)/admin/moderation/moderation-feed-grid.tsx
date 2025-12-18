'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, UserX, Play } from 'lucide-react'
import { format } from 'date-fns'
import { ModerationVideo, deleteVideo, blockUser } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { VideoPlayerModal } from '@/components/feature/VideoPlayerModal'

interface ModerationFeedGridProps {
  initialVideos: ModerationVideo[]
}

export function ModerationFeedGrid({ initialVideos }: ModerationFeedGridProps) {
  const [videos, setVideos] = React.useState<ModerationVideo[]>(initialVideos)
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set())
  const [blockingIds, setBlockingIds] = React.useState<Set<string>>(new Set())
  const [showPlayer, setShowPlayer] = useState<{ videoId: string; videoUrl: string; script: string } | null>(null)
  const router = useRouter()

  // Update videos when initialVideos changes (after router.refresh())
  React.useEffect(() => {
    setVideos(initialVideos)
  }, [initialVideos])

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    setDeletingIds((prev) => new Set(prev).add(videoId))

    try {
      const result = await deleteVideo(videoId)
      if (result.success) {
        // Optimistically remove video from list
        setVideos((prev) => prev.filter((v) => v.id !== videoId))
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete video')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(videoId)
        return next
      })
    }
  }

  const handleBlockUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to block user "${userEmail}"? This will prevent them from using the platform.`
      )
    ) {
      return
    }

    setBlockingIds((prev) => new Set(prev).add(userId))

    try {
      const result = await blockUser(userId)
      if (result.success) {
        alert(`User "${userEmail}" has been blocked successfully.`)
        router.refresh()
      } else {
        alert(result.error || 'Failed to block user')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Failed to block user')
    } finally {
      setBlockingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handlePlayVideo = (video: ModerationVideo) => {
    if (video.video_url) {
      setShowPlayer({
        videoId: video.id,
        videoUrl: video.video_url,
        script: video.final_script || '',
      })
    }
  }

  // Get thumbnail from input_metadata
  const getThumbnail = (video: ModerationVideo): string => {
    if (
      video.input_metadata &&
      typeof video.input_metadata === 'object' &&
      'images' in video.input_metadata &&
      Array.isArray(video.input_metadata.images) &&
      video.input_metadata.images.length > 0 &&
      typeof video.input_metadata.images[0] === 'string'
    ) {
      return video.input_metadata.images[0]
    }
    return 'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=Video+Thumbnail'
  }

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-[#161B22] p-12 text-center">
        <p className="text-muted-foreground">No videos to moderate.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video) => {
          const isDeleting = deletingIds.has(video.id)
          const isBlocking = blockingIds.has(video.user_id)
          const thumbnailUrl = getThumbnail(video)

          return (
            <Card
              key={video.id}
              className="group relative overflow-hidden bg-[#161B22] border-border transition-all hover:border-primary/50"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center cursor-pointer"
                  style={{
                    backgroundImage: `url(${thumbnailUrl})`,
                  }}
                  onClick={() => handlePlayVideo(video)}
                />

                {/* Hover Overlay for Play */}
                {video.video_url && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => handlePlayVideo(video)}>
                    <div className="flex items-center gap-2 text-white">
                      <Play className="h-6 w-6" />
                      <span className="text-sm font-medium">Play</span>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User</p>
                    <p className="text-sm font-medium line-clamp-1">{video.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
                  </div>
                  {video.input_metadata &&
                    typeof video.input_metadata === 'object' &&
                    'title' in video.input_metadata &&
                    typeof video.input_metadata.title === 'string' && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Title</p>
                        <p className="text-xs line-clamp-2">{video.input_metadata.title}</p>
                      </div>
                    )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDeleteVideo(video.id)}
                  disabled={isDeleting || isBlocking}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Video
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBlockUser(video.user_id, video.user_email)}
                  disabled={isDeleting || isBlocking}
                >
                  {isBlocking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayerModal
          videoUrl={showPlayer.videoUrl}
          videoId={showPlayer.videoId}
          script={showPlayer.script}
          onClose={() => setShowPlayer(null)}
        />
      )}
    </>
  )
}

