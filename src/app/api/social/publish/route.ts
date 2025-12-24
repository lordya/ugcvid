import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { publishToSocialMedia } from '@/app/actions/social'

// Validation schema for the social publish request
const socialPublishSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
  platforms: z.array(z.enum(['TIKTOK', 'YOUTUBE', 'INSTAGRAM']))
    .min(1, 'At least one platform must be selected')
    .max(3, 'Maximum 3 platforms allowed'),
  caption: z.string()
    .min(50, 'Caption must be at least 50 characters')
    .max(5000, 'Caption cannot exceed 5000 characters'),
  tags: z.array(z.string())
    .max(30, 'Maximum 30 hashtags allowed')
    .optional()
    .default([]),
})

// Character limits for each platform
const PLATFORM_LIMITS = {
  TIKTOK: 2200,
  YOUTUBE: 5000,
  INSTAGRAM: 2200,
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = socialPublishSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { videoId, platforms, caption, tags } = validationResult.data

    // Validate platform-specific character limits
    for (const platform of platforms) {
      const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS]
      if (caption.length > limit) {
        return NextResponse.json(
          {
            success: false,
            error: `Caption exceeds ${limit} character limit for ${platform}`,
          },
          { status: 400 }
        )
      }
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the video belongs to the user and is completed
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, status, user_id')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Video must be completed before sharing' },
        { status: 400 }
      )
    }

    // Check if user has integrations for the selected platforms
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('provider')
      .eq('user_id', user.id)
      .in('provider', platforms)

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify integrations' },
        { status: 500 }
      )
    }

    const connectedPlatforms = integrations?.map(i => i.provider) || []
    const missingPlatforms = platforms.filter(p => !connectedPlatforms.includes(p))

    if (missingPlatforms.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Please connect your ${missingPlatforms.join(', ')} account(s) in settings before posting`,
        },
        { status: 400 }
      )
    }

    // Publish to social media
    const result = await publishToSocialMedia({
      videoId,
      platforms,
      caption,
      tags,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Video posted successfully',
        results: result.results,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to post to social media',
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in social publish API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
