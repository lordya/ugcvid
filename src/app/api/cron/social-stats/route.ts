import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPostAnalytics, AnalyticsBatchProcessor } from '@/lib/social-analytics'
import { decryptToken } from '@/lib/utils'

// Cron job for fetching social media analytics
// Runs daily to update view counts, likes, and shares for published posts

export async function GET(request: NextRequest) {
  try {
    console.log('Starting social analytics polling cron job')

    const supabase = await createClient()

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
      .is('analytics_last_updated', null) // Only posts that haven't been analyzed yet
      .order('created_at', { ascending: false }) // Prioritize recent posts

    if (postsError) {
      console.error('Error fetching video posts for analytics:', postsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    if (!videoPosts || videoPosts.length === 0) {
      console.log('No posts found for analytics update')
      return NextResponse.json({
        success: true,
        message: 'No posts to update',
        processed: 0
      })
    }

    // Fetch integration data for all posts
    const integrationIds = [...new Set(videoPosts.map(post => post.integration_id))]
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('id, provider, access_token, token_expires_at, user_id')
      .in('id', integrationIds)

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    if (!integrations) {
      console.error('No integrations found')
      return NextResponse.json(
        { success: false, error: 'No integrations found' },
        { status: 500 }
      )
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

    if (postsError) {
      console.error('Error fetching video posts for analytics:', postsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

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
      // Sort posts by recency and prioritize last 7 days
      posts.sort((a, b) => {
        const aIsRecent = new Date(a.created_at) > sevenDaysAgo
        const bIsRecent = new Date(b.created_at) > sevenDaysAgo

        if (aIsRecent && !bIsRecent) return -1
        if (!aIsRecent && bIsRecent) return 1

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      for (const post of posts) {
        try {
          // Check rate limit before processing
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

          // If it's a rate limit error, wait before continuing
          if (error instanceof Error && error.message.includes('RATE_LIMIT_EXCEEDED')) {
            await batchProcessor.waitForNextWindow(platform)
          }
        }
      }
    }

    console.log(`Social analytics cron job completed. Processed: ${processed}, Errors: ${errors}`)

    return NextResponse.json({
      success: true,
      message: 'Analytics update completed',
      processed,
      errors,
      totalPosts: postsWithIntegrations.length
    })

  } catch (error) {
    console.error('Error in social analytics cron job:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow GET requests from Vercel Cron
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
