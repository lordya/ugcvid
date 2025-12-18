import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getTaskStatus } from '@/lib/kie'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // 2. Use admin client to fetch video record
    const adminClient = createAdminClient()

    const { data: video, error: videoError } = await adminClient
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      console.error('Error fetching video:', videoError)
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 3. Verify user owns this video
    if (video.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. If status is already COMPLETED or FAILED, return immediately (no external call)
    if (video.status === 'COMPLETED' || video.status === 'FAILED') {
      return NextResponse.json({
        id: video.id,
        status: video.status,
        videoUrl: video.video_url || undefined,
        errorReason: video.error_reason || undefined,
      })
    }

    // 5. If status is PROCESSING, check Kie.ai status
    if (video.status === 'PROCESSING') {
      if (!video.kie_task_id) {
        // Video is in PROCESSING state but has no task_id - this shouldn't happen
        // but we'll mark it as failed
        await adminClient
          .from('videos')
          .update({
            status: 'FAILED',
            error_reason: 'Video task ID is missing',
          })
          .eq('id', videoId)

        return NextResponse.json({
          id: video.id,
          status: 'FAILED',
          errorReason: 'Video task ID is missing',
        })
      }

      try {
        // Call Kie.ai to check status
        const kieStatus = await getTaskStatus(video.kie_task_id)

        if (kieStatus.status === 'COMPLETED' && kieStatus.videoUrl) {
          // Update video record with completed status and URL
          const { error: updateError } = await adminClient
            .from('videos')
            .update({
              status: 'COMPLETED',
              video_url: kieStatus.videoUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', videoId)

          if (updateError) {
            console.error('Error updating video:', updateError)
            // Still return the status even if update fails
          }

          return NextResponse.json({
            id: video.id,
            status: 'COMPLETED',
            videoUrl: kieStatus.videoUrl,
          })
        } else if (kieStatus.status === 'FAILED') {
          // Update video record with failed status and error
          const errorReason = kieStatus.errorMessage || 'Video generation failed'

          const { error: updateError } = await adminClient
            .from('videos')
            .update({
              status: 'FAILED',
              error_reason: errorReason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', videoId)

          if (updateError) {
            console.error('Error updating video:', updateError)
          }

          // CRITICAL: Create REFUND transaction to restore the credit
          const { error: refundError } = await adminClient.from('transactions').insert({
            user_id: user.id,
            amount: 1, // Positive amount to refund
            type: 'REFUND',
            provider: 'SYSTEM',
            payment_id: null,
          })

          if (refundError) {
            console.error('CRITICAL: Error creating refund transaction:', refundError)
            // Log this as a critical error - credit was deducted but refund failed
            // In production, you might want to alert admins about this
          }

          return NextResponse.json({
            id: video.id,
            status: 'FAILED',
            errorReason,
          })
        } else {
          // Still processing (PROCESSING status)
          return NextResponse.json({
            id: video.id,
            status: 'PROCESSING',
            progress: kieStatus.progress,
          })
        }
      } catch (kieError) {
        console.error('Error checking Kie.ai status:', kieError)

        // If we can't check status, return current status without updating
        // This prevents us from marking videos as failed due to temporary API issues
        return NextResponse.json({
          id: video.id,
          status: video.status,
          errorReason: kieError instanceof Error ? kieError.message : 'Failed to check status',
        })
      }
    }

    // 6. For any other status (DRAFT, SCRIPT_GENERATED), return as-is
    return NextResponse.json({
      id: video.id,
      status: video.status,
    })
  } catch (error) {
    console.error('Video status API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

