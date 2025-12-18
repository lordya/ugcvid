'use client'

import { VideoCard } from '@/components/feature/VideoCard'
import { VideoStatusFilter, SortOption } from './LibraryToolbar'

interface Video {
  id: string
  status: 'DRAFT' | 'SCRIPT_GENERATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  video_url: string | null
  final_script: string | null
  input_metadata: {
    title?: string
    description?: string
    images?: string[]
  } | null
  created_at: string
}

interface VideoGridProps {
  videos: Video[]
  statusFilter: VideoStatusFilter
  sortOption: SortOption
  isSelectionMode: boolean
  selectedVideoIds: Set<string>
  onVideoSelect: (videoId: string, selected: boolean) => void
}

export function VideoGrid({
  videos,
  statusFilter,
  sortOption,
  isSelectionMode,
  selectedVideoIds,
  onVideoSelect,
}: VideoGridProps) {
  // Filter videos by status
  const filteredVideos = videos.filter((video) => {
    if (statusFilter === 'ALL') return true

    switch (statusFilter) {
      case 'READY':
        return video.status === 'COMPLETED'
      case 'PROCESSING':
        return video.status === 'PROCESSING' || video.status === 'SCRIPT_GENERATED'
      case 'FAILED':
        return video.status === 'FAILED'
      default:
        return true
    }
  })

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()

    if (sortOption === 'NEWEST') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  if (sortedVideos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-[#161B22] p-12 text-center">
        <p className="text-muted-foreground text-lg">
          No videos found matching your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {sortedVideos.map((video) => (
        <div key={video.id} className="relative">
          {isSelectionMode && (
            <div className="absolute top-3 left-3 z-20">
              <div className="bg-[#161B22] rounded border border-border p-0.5">
                <input
                  type="checkbox"
                  checked={selectedVideoIds.has(video.id)}
                  onChange={(e) => onVideoSelect(video.id, e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-[#6366F1] rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <div className={isSelectionMode ? 'opacity-90' : ''}>
            <VideoCard video={video} />
          </div>
        </div>
      ))}
    </div>
  )
}

