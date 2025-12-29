import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { storeVideoFromKie, getSignedVideoUrl } from '@/lib/video-storage'

// Disable body parsing to get raw body for signature verification if needed
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Kie.ai Webhook Payload Structure
 * Based on Kie.ai webhook documentation and observed API responses
 */
interface KieWebhookPayload {
  task_id?: string
  taskId?: string
  status?: string
  state?: string
  success?: boolean
  result_url?: string
  resultUrl?: string
  video_url?: string
  videoUrl?: string
  error_message?: string
  errorMessage?: string
  progress?: number
  completed_at?: string
  created_at?: string
}

/**
 * Processes Kie.ai webhook notifications for video generation status updates
 * Handles completion, failure, and progress updates in real-time
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse webhook payload
    const payload: KieWebhookPayload = await request.json()

    console.log('[Kie.ai Webhook] Received payload:', payload)

    // 2. Extract task identifier (support both snake_case and camelCase)
    const taskId = payload.task_id || payload.taskId
    if (!taskId) {
      console.error('[Kie.ai Webhook] Missing task_id in payload')
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 })
    }

    // 3. Extract status information
    const status = payload.status || payload.state
    const isCompleted = status === 'completed' || status === 'success' || payload.success === true
    const isFailed = status === 'failed' || status === 'error' || payload.success === false
    const progress = payload.progress

    // 4. Extract result URLs (support multiple formats)
    const resultUrl = payload.result_url || payload.resultUrl || payload.video_url || payload.videoUrl

    // 5. Extract error information
    const errorMessage = payload.error_message || payload.errorMessage

    // 6. Find video record by kie_task_id
    const adminClient = createAdminClient()
    const { data: video, error: videoError } = await adminClient
      .from('videos')
      .select('*')
      .eq('kie_task_id', taskId)
      .single()

    if (videoError || !video) {
      console.error('[Kie.ai Webhook] Video not found for task_id:', taskId, videoError)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    console.log(`[Kie.ai Webhook] Processing ${status} for video ${video.id}, user ${video.user_id}`)

    // 7. Handle different status types
    if (isCompleted && resultUrl) {
      await handleVideoCompleted(adminClient, video, resultUrl)
    } else if (isFailed) {
      await handleVideoFailed(adminClient, video, errorMessage || 'Video generation failed')
    } else if (progress !== undefined) {
      await handleProgressUpdate(adminClient, video, progress)
    } else {
      console.log(`[Kie.ai Webhook] Ignoring status update: ${status} for video ${video.id}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 })

  } catch (error) {
    console.error('[Kie.ai Webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Handles video completion webhook
 */
async function handleVideoCompleted(
  adminClient: any,
  video: any,
  resultUrl: string
) {
  console.log(`[Kie.ai Webhook] Processing completion for video ${video.id}`)

  try {
    // 1. Try to download and store video in Supabase Storage
    let storagePath: string | null = null
    let signedUrl: string | null = null

    try {
      storagePath = await storeVideoFromKie(resultUrl, video.user_id, video.id)

      if (storagePath) {
        // Generate signed URL for the stored video
        signedUrl = await getSignedVideoUrl(storagePath)
      }
    } catch (storageError) {
      console.error('[Kie.ai Webhook] Error storing video in Supabase Storage:', storageError)
      // Continue with Kie.ai URL as fallback
    }

    // 2. Update video record with completed status
    const updateData: {
      status: 'COMPLETED'
      video_url: string
      updated_at: string
      storage_path?: string | null
    } = {
      status: 'COMPLETED',
      video_url: resultUrl,
      updated_at: new Date().toISOString(),
    }

    if (storagePath) {
      updateData.storage_path = storagePath
    }

    const { error: updateError } = await adminClient
      .from('videos')
      .update(updateData)
      .eq('id', video.id)

    if (updateError) {
      console.error('[Kie.ai Webhook] Error updating video record:', updateError)
      throw updateError
    }

    // 3. Update analytics record with completion
    const completedAt = new Date().toISOString()
    const generationTimeSeconds = video.created_at
      ? Math.floor((new Date(completedAt).getTime() - new Date(video.created_at).getTime()) / 1000)
      : null

    const { error: analyticsError } = await adminClient
      .from('generation_analytics')
      .update({
        status: 'COMPLETED',
        completed_at: completedAt,
        generation_time_seconds: generationTimeSeconds,
      })
      .eq('video_id', video.id)

    if (analyticsError) {
      console.error('[Kie.ai Webhook] Error updating analytics:', analyticsError)
      // Analytics is non-critical, don't throw
    }

    console.log(`[Kie.ai Webhook] Successfully processed completion for video ${video.id}`)

  } catch (error) {
    console.error('[Kie.ai Webhook] Error in handleVideoCompleted:', error)
    throw error
  }
}

/**
 * Handles video failure webhook
 */
async function handleVideoFailed(
  adminClient: any,
  video: any,
  errorMessage: string
) {
  console.log(`[Kie.ai Webhook] Processing failure for video ${video.id}: ${errorMessage}`)

  try {
    // 1. Update video record with failed status
    const { error: updateError } = await adminClient
      .from('videos')
      .update({
        status: 'FAILED',
        error_reason: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', video.id)

    if (updateError) {
      console.error('[Kie.ai Webhook] Error updating video record:', updateError)
      throw updateError
    }

    // 2. Create REFUND transaction to restore credits
    const videoCostCredits = (video.input_metadata as any)?.costCredits || 1
    const { error: refundError } = await adminClient.from('transactions').insert({
      user_id: video.user_id,
      amount: videoCostCredits, // Refund actual cost
      type: 'REFUND',
      provider: 'SYSTEM',
      payment_id: null,
      metadata: {
        video_id: video.id,
        reason: 'Video generation failed',
        original_cost_credits: videoCostCredits,
        error_message: errorMessage,
      } as any,
    })

    if (refundError) {
      console.error('[Kie.ai Webhook] CRITICAL: Error creating refund transaction:', refundError)
      // This is critical - credit was deducted but refund failed
      throw refundError
    }

    // 3. Update analytics record with failure
    const completedAt = new Date().toISOString()
    const generationTimeSeconds = video.created_at
      ? Math.floor((new Date(completedAt).getTime() - new Date(video.created_at).getTime()) / 1000)
      : null

    const { error: analyticsError } = await adminClient
      .from('generation_analytics')
      .update({
        status: 'FAILED',
        completed_at: completedAt,
        error_reason: errorMessage,
        generation_time_seconds: generationTimeSeconds,
      })
      .eq('video_id', video.id)

    if (analyticsError) {
      console.error('[Kie.ai Webhook] Error updating analytics:', analyticsError)
      // Analytics is non-critical, don't throw
    }

    console.log(`[Kie.ai Webhook] Successfully processed failure for video ${video.id}`)

  } catch (error) {
    console.error('[Kie.ai Webhook] Error in handleVideoFailed:', error)
    throw error
  }
}

/**
 * Handles progress update webhook
 */
async function handleProgressUpdate(
  adminClient: any,
  video: any,
  progress: number
) {
  console.log(`[Kie.ai Webhook] Processing progress update for video ${video.id}: ${progress}%`)

  try {
    // Update analytics record with progress (if table supports it)
    // Note: progress_percentage column doesn't exist in current schema, so this will be ignored
    const { error: analyticsError } = await adminClient
      .from('generation_analytics')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', video.id)

    if (analyticsError) {
      console.error('[Kie.ai Webhook] Error updating progress:', analyticsError)
      // Progress updates are non-critical, don't throw
    }

    console.log(`[Kie.ai Webhook] Successfully updated progress for video ${video.id}`)

  } catch (error) {
    console.error('[Kie.ai Webhook] Error in handleProgressUpdate:', error)
    throw error
  }
}
