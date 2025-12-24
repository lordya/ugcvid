import { decryptToken } from '@/lib/utils'

// Types for analytics data
export interface PostAnalytics {
  viewCount: number
  likeCount: number
  shareCount: number
  commentCount?: number
  lastUpdated: string
}

export interface SocialAnalyticsError {
  platform: string
  error: string
  retryable: boolean
}

// Rate limiting configuration per platform
const RATE_LIMITS = {
  TIKTOK: { requests: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500 requests per day
  YOUTUBE: { requests: 10000, windowMs: 24 * 60 * 60 * 1000 }, // 10k requests per day
  INSTAGRAM: { requests: 200, windowMs: 60 * 60 * 1000 }, // 200 requests per hour
}

// Exponential backoff utility
export class ExponentialBackoff {
  private attempts = 0
  private baseDelay = 1000 // 1 second
  private maxDelay = 300000 // 5 minutes
  private maxAttempts = 5

  async delay(): Promise<void> {
    if (this.attempts >= this.maxAttempts) {
      throw new Error('Max retry attempts exceeded')
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts),
      this.maxDelay
    )

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay
    const totalDelay = delay + jitter

    await new Promise(resolve => setTimeout(resolve, totalDelay))
    this.attempts++
  }

  reset(): void {
    this.attempts = 0
  }
}

// TikTok Analytics API
export async function getTikTokAnalytics(
  accessToken: string,
  postId: string
): Promise<PostAnalytics> {
  const response = await fetch(
    `https://open-api.tiktok.com/research/video/query/?video_id=${postId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    throw new Error(`TikTok API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    viewCount: data.video?.view_count || 0,
    likeCount: data.video?.like_count || 0,
    shareCount: data.video?.share_count || 0,
    commentCount: data.video?.comment_count || 0,
    lastUpdated: new Date().toISOString(),
  }
}

// YouTube Analytics API
export async function getYouTubeAnalytics(
  accessToken: string,
  postId: string
): Promise<PostAnalytics> {
  // Get video statistics
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${postId}&part=statistics`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const stats = data.items?.[0]?.statistics

  return {
    viewCount: parseInt(stats?.viewCount || '0'),
    likeCount: parseInt(stats?.likeCount || '0'),
    shareCount: parseInt(stats?.shareCount || '0'),
    commentCount: parseInt(stats?.commentCount || '0'),
    lastUpdated: new Date().toISOString(),
  }
}

// Instagram Basic Display API (limited analytics)
export async function getInstagramAnalytics(
  accessToken: string,
  postId: string
): Promise<PostAnalytics> {
  // Note: Instagram Basic Display API has limited analytics
  // For full analytics, Instagram Business API would be needed
  const response = await fetch(
    `https://graph.instagram.com/${postId}?fields=like_count,comments_count,media_type&access_token=${accessToken}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    throw new Error(`Instagram API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    viewCount: data.media_type === 'VIDEO' ? data.view_count || 0 : 0, // Only available for videos
    likeCount: data.like_count || 0,
    shareCount: 0, // Not available in Basic Display API
    commentCount: data.comments_count || 0,
    lastUpdated: new Date().toISOString(),
  }
}

// Main analytics fetching function with retry logic
export async function fetchPostAnalytics(
  platform: string,
  accessToken: string,
  postId: string
): Promise<PostAnalytics> {
  const backoff = new ExponentialBackoff()

  while (true) {
    try {
      switch (platform) {
        case 'TIKTOK':
          return await getTikTokAnalytics(accessToken, postId)
        case 'YOUTUBE':
          return await getYouTubeAnalytics(accessToken, postId)
        case 'INSTAGRAM':
          return await getInstagramAnalytics(accessToken, postId)
        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        await backoff.delay()
        continue
      }

      // For other errors, don't retry
      throw error
    }
  }
}

// Batch processing utility to respect rate limits
export class AnalyticsBatchProcessor {
  private processed = new Map<string, number>() // platform -> count
  private lastReset = Date.now()

  canProcess(platform: string): boolean {
    const now = Date.now()
    const limit = RATE_LIMITS[platform as keyof typeof RATE_LIMITS]

    if (!limit) return true

    // Reset counter if window has passed
    if (now - this.lastReset > limit.windowMs) {
      this.processed.clear()
      this.lastReset = now
    }

    const current = this.processed.get(platform) || 0
    return current < limit.requests
  }

  recordProcessed(platform: string): void {
    const current = this.processed.get(platform) || 0
    this.processed.set(platform, current + 1)
  }

  async waitForNextWindow(platform: string): Promise<void> {
    const limit = RATE_LIMITS[platform as keyof typeof RATE_LIMITS]
    if (!limit) return

    const now = Date.now()
    const timeUntilReset = limit.windowMs - (now - this.lastReset)

    if (timeUntilReset > 0) {
      await new Promise(resolve => setTimeout(resolve, timeUntilReset))
      this.processed.clear()
      this.lastReset = Date.now()
    }
  }
}
