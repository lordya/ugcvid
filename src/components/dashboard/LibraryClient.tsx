'use client'

import { useState, useEffect } from 'react'
import { LibraryToolbar, VideoStatusFilter, SortOption } from './LibraryToolbar'
import { VideoGrid } from './VideoGrid'
import { getVideoPostsByVideoId, retryVideoPost, VideoPost } from '@/app/actions/video-posts'

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
  const [videoPostsMap, setVideoPostsMap] = useState<Record<string, VideoPost[]>>({})
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  // Fetch video posts for all videos
  useEffect(() => {
    const fetchVideoPosts = async () => {
      if (videos.length === 0) return

      setIsLoadingPosts(true)
      try {
        const postsMap: Record<string, VideoPost[]> = {}

        // Fetch posts for each video that has completed
        await Promise.all(
          videos
            .filter(video => video.status === 'COMPLETED')
            .map(async (video) => {
              try {
                const result = await getVideoPostsByVideoId(video.id)
                if (result.success && result.videoPosts) {
                  postsMap[video.id] = result.videoPosts
                }
              } catch (error) {
                console.error(`Failed to fetch posts for video ${video.id}:`, error)
              }
            })
        )

        setVideoPostsMap(postsMap)
      } catch (error) {
        console.error('Failed to fetch video posts:', error)
      } finally {
        setIsLoadingPosts(false)
      }
    }

    fetchVideoPosts()
  }, [videos])

  const handleRetryPost = async (videoPostId: string) => {
    try {
      const result = await retryVideoPost(videoPostId)
      if (result.success) {
        // Refresh posts for the video that was retried
        const videoId = Object.keys(videoPostsMap).find(videoId =>
          videoPostsMap[videoId].some(post => post.id === videoPostId)
        )

        if (videoId) {
          const result = await getVideoPostsByVideoId(videoId)
          if (result.success && result.videoPosts) {
            setVideoPostsMap(prev => ({
              ...prev,
              [videoId]: result.videoPosts!
            }))
          }
        }
      } else {
        console.error('Failed to retry post:', result.error)
      }
    } catch (error) {
      console.error('Error retrying post:', error)
    }
  }

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
        videoPostsMap={videoPostsMap}
        onRetryPost={handleRetryPost}
      />
    </>
  )
}

