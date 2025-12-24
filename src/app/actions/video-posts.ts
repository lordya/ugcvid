'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

export type VideoPost = Tables<'video_posts'>
export type VideoPostInsert = TablesInsert<'video_posts'>
export type VideoPostUpdate = TablesUpdate<'video_posts'>

// Schema for creating a new video post
const createVideoPostSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
  integrationId: z.string().uuid('Invalid integration ID'),
  status: z.enum(['PENDING', 'PUBLISHED', 'FAILED']).default('PENDING'),
  externalPostId: z.string().optional(),
  errorMessage: z.string().optional(),
  postedAt: z.string().optional(),
})

// Schema for updating a video post
const updateVideoPostSchema = z.object({
  id: z.string().uuid('Invalid video post ID'),
  status: z.enum(['PENDING', 'PUBLISHED', 'FAILED']).optional(),
  externalPostId: z.string().optional(),
  errorMessage: z.string().optional(),
  postedAt: z.string().optional(),
})

// Schema for getting video posts by video ID
const getVideoPostsByVideoIdSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
})

/**
 * Create a new video post record
 */
export async function createVideoPost(data: {
  videoId: string
  integrationId: string
  status?: 'PENDING' | 'PUBLISHED' | 'FAILED'
  externalPostId?: string
  errorMessage?: string
  postedAt?: string
}): Promise<{ success: boolean; videoPost?: VideoPost; error?: string }> {
  try {
    const validationResult = createVideoPostSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        // details: validationResult.error.format()
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify the video belongs to the user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, user_id')
      .eq('id', data.videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      return { success: false, error: 'Video not found or access denied' }
    }

    // Verify the integration belongs to the user
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('id, user_id')
      .eq('id', data.integrationId)
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration) {
      return { success: false, error: 'Integration not found or access denied' }
    }

    const insertData: VideoPostInsert = {
      video_id: data.videoId,
      integration_id: data.integrationId,
      status: data.status || 'PENDING',
      external_post_id: data.externalPostId || null,
      error_message: data.errorMessage || null,
      posted_at: data.postedAt ? new Date(data.postedAt).toISOString() : null,
    }

    const { data: videoPost, error: insertError } = await supabase
      .from('video_posts')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating video post:', insertError)
      return { success: false, error: 'Failed to create video post record' }
    }

    return { success: true, videoPost }
  } catch (error) {
    console.error('Error in createVideoPost:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Update an existing video post record
 */
export async function updateVideoPost(data: {
  id: string
  status?: 'PENDING' | 'PUBLISHED' | 'FAILED'
  externalPostId?: string
  errorMessage?: string
  postedAt?: string
}): Promise<{ success: boolean; videoPost?: VideoPost; error?: string }> {
  try {
    const validationResult = updateVideoPostSchema.safeParse(data)

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        // details: validationResult.error.format()
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const updateData: VideoPostUpdate = {}

    if (data.status) updateData.status = data.status
    if (data.externalPostId !== undefined) updateData.external_post_id = data.externalPostId
    if (data.errorMessage !== undefined) updateData.error_message = data.errorMessage
    if (data.postedAt !== undefined) updateData.posted_at = data.postedAt ? new Date(data.postedAt).toISOString() : null

    const { data: videoPost, error: updateError } = await supabase
      .from('video_posts')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating video post:', updateError)
      return { success: false, error: 'Failed to update video post record' }
    }

    return { success: true, videoPost }
  } catch (error) {
    console.error('Error in updateVideoPost:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get all video posts for a specific video
 */
export async function getVideoPostsByVideoId(videoId: string): Promise<{
  success: boolean
  videoPosts?: VideoPost[]
  error?: string
}> {
  try {
    const validationResult = getVideoPostsByVideoIdSchema.safeParse({ videoId })

    if (!validationResult.success) {
      return { success: false, error: 'Invalid video ID' }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: videoPosts, error: fetchError } = await supabase
      .from('video_posts')
      .select(`
        *,
        user_integrations!inner (
          provider,
          provider_username,
          provider_display_name
        )
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching video posts:', fetchError)
      return { success: false, error: 'Failed to fetch video posts' }
    }

    return { success: true, videoPosts: videoPosts || [] }
  } catch (error) {
    console.error('Error in getVideoPostsByVideoId:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Retry a failed video post
 */
export async function retryVideoPost(videoPostId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the video post with related data
    const { data: videoPost, error: fetchError } = await supabase
      .from('video_posts')
      .select(`
        *,
        videos!inner (
          id,
          video_url,
          final_script,
          user_id
        ),
        user_integrations!inner (
          id,
          provider,
          access_token,
          metadata,
          user_id
        )
      `)
      .eq('id', videoPostId)
      .eq('videos.user_id', user.id)
      .eq('user_integrations.user_id', user.id)
      .single()

    if (fetchError || !videoPost) {
      return { success: false, error: 'Video post not found or access denied' }
    }

    // Reset the status to PENDING and clear error
    const { error: updateError } = await supabase
      .from('video_posts')
      .update({
        status: 'PENDING',
        error_message: null,
        external_post_id: null,
        posted_at: null,
      })
      .eq('id', videoPostId)

    if (updateError) {
      console.error('Error resetting video post:', updateError)
      return { success: false, error: 'Failed to reset video post for retry' }
    }

    // TODO: Trigger the actual retry logic here
    // This could queue a background job or call the social publishing logic

    return { success: true }
  } catch (error) {
    console.error('Error in retryVideoPost:', error)
    return { success: false, error: 'Internal server error' }
  }
}
