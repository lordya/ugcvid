'use client'

import { useState } from 'react'
import { LibraryToolbar, VideoStatusFilter, SortOption } from './LibraryToolbar'
import { VideoGrid } from './VideoGrid'

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

interface LibraryClientProps {
  videos: Video[]
}

export function LibraryClient({ videos }: LibraryClientProps) {
  const [statusFilter, setStatusFilter] = useState<VideoStatusFilter>('ALL')
  const [sortOption, setSortOption] = useState<SortOption>('NEWEST')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())

  const handleVideoSelect = (videoId: string, selected: boolean) => {
    setSelectedVideoIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(videoId)
      } else {
        newSet.delete(videoId)
      }
      return newSet
    })
  }

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (prev) {
        // Exiting selection mode - clear selections
        setSelectedVideoIds(new Set())
      }
      return !prev
    })
  }

  return (
    <>
      <LibraryToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        selectedCount={selectedVideoIds.size}
      />

      <VideoGrid
        videos={videos}
        statusFilter={statusFilter}
        sortOption={sortOption}
        isSelectionMode={isSelectionMode}
        selectedVideoIds={selectedVideoIds}
        onVideoSelect={handleVideoSelect}
      />
    </>
  )
}

