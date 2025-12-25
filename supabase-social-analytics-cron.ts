import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  CRON_SECRET_TOKEN: string
}

// Utility function to decrypt token (simplified for Edge Function)
function decryptToken(encryptedToken: string): string {
  // For this example, we'll assume the token is base64 encoded
  // In production, you'd want proper encryption/decryption
  try {
    return atob(encryptedToken)
  } catch {
    return encryptedToken
  }
}

// Simple analytics batch processor
class AnalyticsBatchProcessor {
  private requests: Record<string, number[]> = {}
  private limits = {
    tiktok: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    youtube: { requests: 10000, windowMs: 24 * 60 * 60 * 1000 }, // 10,000 per day
    instagram: { requests: 200, windowMs: 60 * 60 * 1000 } // 200 per hour
  }

  canProcess(platform: string): boolean {
    const now = Date.now()
    const limit = this.limits[platform as keyof typeof this.limits]
    if (!limit) return true

    const requests = this.requests[platform] || []
    const windowStart = now - limit.windowMs
    const recentRequests = requests.filter(time => time > windowStart)

    return recentRequests.length < limit.requests
  }

  recordProcessed(platform: string): void {
    const now = Date.now()
    if (!this.requests[platform]) {
      this.requests[platform] = []
    }
    this.requests[platform].push(now)
  }

  async waitForNextWindow(platform: string): Promise<void> {
    const limit = this.limits[platform as keyof typeof this.limits]
    if (!limit) return

    const now = Date.now()
    const requests = this.requests[platform] || []
    const windowStart = now - limit.windowMs
    const recentRequests = requests.filter(time => time > windowStart)

    if (recentRequests.length >= limit.requests) {
      const oldestRequest = Math.min(...recentRequests)
      const waitTime = limit.windowMs - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000))) // Max 1 minute wait
    }
  }
}

// Mock analytics fetch function (simplified for Edge Function)
async function fetchPostAnalytics(platform: string, accessToken: string, postId: string) {
  // This is a simplified version - in production you'd implement actual API calls
  // For now, return mock data
  const mockData = {
    viewCount: Math.floor(Math.random() * 10000),
    likeCount: Math.floor(Math.random() * 1000),
    shareCount: Math.floor(Math.random() * 100),
    lastUpdated: new Date().toISOString()
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))

  return mockData
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Validate the request is from our cron job
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET_TOKEN}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      console.log('Starting social analytics polling cron job')

      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

      // Get all published video posts from the last 30 days (excluding last 24 hours)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1)

      const { data: videoPosts, error: postsError } = await supabase
        .from('video_posts')
        .select(`
          id,
          external_post_id,
          integration_id,
          created_at,
          analytics_last_updated
        `)
        .eq('status', 'PUBLISHED')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .lte('created_at', twentyFourHoursAgo.toISOString())
        .is('analytics_last_updated', null)
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching video posts for analytics:', postsError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch posts'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (!videoPosts || videoPosts.length === 0) {
        console.log('No posts found for analytics update')
        return new Response(JSON.stringify({
          success: true,
          message: 'No posts to update',
          processed: 0
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Fetch integration data for all posts
      const integrationIds = [...new Set(videoPosts.map(post => post.integration_id))]
      const { data: integrations, error: integrationsError } = await supabase
        .from('user_integrations')
        .select('id, provider, access_token, token_expires_at, user_id')
        .in('id', integrationIds)

      if (integrationsError || !integrations) {
        console.error('Error fetching integrations:', integrationsError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch integrations'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Create a map of integration data
      const integrationMap = integrations.reduce((acc, integration) => {
        acc[integration.id] = integration
        return acc
      }, {} as Record<string, any>)

      // Combine posts with integration data
      const postsWithIntegrations = videoPosts.map(post => ({
        ...post,
        user_integrations: integrationMap[post.integration_id]
      }))

      console.log(`Found ${postsWithIntegrations.length} posts for analytics update`)

      // Initialize batch processor for rate limiting
      const batchProcessor = new AnalyticsBatchProcessor()
      let processed = 0
      let errors = 0

      // Process posts in batches by platform to respect rate limits
      const postsByPlatform = postsWithIntegrations.reduce((acc, post) => {
        const platform = post.user_integrations?.provider
        if (!platform) return acc
        if (!acc[platform]) acc[platform] = []
        acc[platform].push(post)
        return acc
      }, {} as Record<string, typeof postsWithIntegrations>)

      // Prioritize recent posts (last 7 days) for each platform
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      for (const [platform, posts] of Object.entries(postsByPlatform)) {
        posts.sort((a, b) => {
          const aIsRecent = new Date(a.created_at) > sevenDaysAgo
          const bIsRecent = new Date(b.created_at) > sevenDaysAgo

          if (aIsRecent && !bIsRecent) return -1
          if (!aIsRecent && bIsRecent) return 1

          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        for (const post of posts) {
          try {
            if (!batchProcessor.canProcess(platform)) {
              console.log(`Rate limit reached for ${platform}, waiting for next window`)
              await batchProcessor.waitForNextWindow(platform)
            }

            // Skip if token is expired
            if (post.user_integrations.token_expires_at &&
                new Date(post.user_integrations.token_expires_at) < new Date()) {
              console.warn(`Skipping post ${post.id}: token expired for ${platform}`)
              continue
            }

            // Skip if no external post ID
            if (!post.external_post_id) {
              console.warn(`Skipping post ${post.id}: no external post ID`)
              continue
            }

            // Decrypt access token
            const accessToken = decryptToken(post.user_integrations.access_token)

            // Fetch analytics
            const analytics = await fetchPostAnalytics(
              platform,
              accessToken,
              post.external_post_id
            )

            // Update the database
            const { error: updateError } = await supabase
              .from('video_posts')
              .update({
                view_count: analytics.viewCount,
                like_count: analytics.likeCount,
                share_count: analytics.shareCount,
                analytics_last_updated: analytics.lastUpdated,
              })
              .eq('id', post.id)

            if (updateError) {
              console.error(`Error updating analytics for post ${post.id}:`, updateError)
              errors++
            } else {
              console.log(`Updated analytics for post ${post.id}: ${analytics.viewCount} views, ${analytics.likeCount} likes, ${analytics.shareCount} shares`)
              processed++
            }

            // Record this request for rate limiting
            batchProcessor.recordProcessed(platform)

            // Small delay between requests to be respectful to APIs
            await new Promise(resolve => setTimeout(resolve, 100))

          } catch (error) {
            console.error(`Error processing analytics for post ${post.id}:`, error)
            errors++

            if (error instanceof Error && error.message.includes('RATE_LIMIT_EXCEEDED')) {
              await batchProcessor.waitForNextWindow(platform)
            }
          }
        }
      }

      console.log(`Social analytics cron job completed. Processed: ${processed}, Errors: ${errors}`)

      return new Response(JSON.stringify({
        success: true,
        message: 'Analytics update completed',
        processed,
        errors,
        totalPosts: postsWithIntegrations.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Error in social analytics cron job:', error)
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
