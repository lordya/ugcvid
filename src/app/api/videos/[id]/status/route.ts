import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getTaskStatus } from '@/lib/kie'
import { storeVideoFromKie, getSignedVideoUrl } from '@/lib/video-storage'
import { validateVideoQuality, shouldAutoRefund, getQualityIssuesSummary } from '@/lib/quality-validation'
import { QUALITY_TIERS } from '@/lib/prompts'
import { selectModelForQualityRisk, KIE_MODELS } from '@/lib/kie-models'
import { createVideoTask } from '@/lib/kie'
import { analyzeContentForQuality } from '@/lib/quality-analysis'

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

    // 3.1. Fetch user's auto-regeneration preference
    const { data: userProfile, error: userError } = await adminClient
      .from('users')
      .select('auto_regenerate_on_low_quality, quality_tier')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile) {
      console.error('Error fetching user profile:', userError)
      // Continue without auto-regeneration (default to false)
    }

    const autoRegenerateEnabled = (userProfile as any)?.auto_regenerate_on_low_quality || false
    const userQualityTier = (userProfile as any)?.quality_tier || 'standard'

    // 4. TTL Check: If video has been PROCESSING for more than 60 minutes, mark as FAILED
    if (video.status === 'PROCESSING') {
      const updatedAt = new Date(video.updated_at)
      const now = new Date()
      const timeDiff = now.getTime() - updatedAt.getTime()
      const sixtyMinutes = 60 * 60 * 1000 // 60 minutes in milliseconds

      if (timeDiff > sixtyMinutes) {
        // Mark as failed and create refund
        const { error: updateError } = await adminClient
          .from('videos')
          .update({
            status: 'FAILED',
            error_reason: 'Video generation timed out after 60 minutes',
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)

        if (updateError) {
          console.error('Error updating timed-out video:', updateError)
        }

        // Create REFUND transaction to restore the credit
        // Get actual cost from video metadata
        const videoCostCredits = (video.input_metadata as any)?.costCredits || 1
        const { error: refundError } = await adminClient.from('transactions').insert({
          user_id: user.id,
          amount: videoCostCredits, // Refund actual cost
          type: 'REFUND',
          provider: 'SYSTEM',
          payment_id: null,
          metadata: {
            video_id: videoId,
            reason: 'Video generation timed out after 60 minutes',
            original_cost_credits: videoCostCredits,
          } as any,
        })

        if (refundError) {
          console.error('CRITICAL: Error creating refund transaction for timed-out video:', refundError)
        }

        // Update analytics record for timeout
        const completedAt = new Date().toISOString()
        const videoCreatedAt = video.created_at
        const generationTimeSeconds = videoCreatedAt 
          ? Math.floor((new Date(completedAt).getTime() - new Date(videoCreatedAt).getTime()) / 1000)
          : null

        // Note: generation_analytics table is new and may not be in TypeScript types yet
        const { error: analyticsError } = await (adminClient as any)
          .from('generation_analytics')
          .update({
            status: 'FAILED',
            completed_at: completedAt,
            error_reason: 'Video generation timed out after 60 minutes',
            generation_time_seconds: generationTimeSeconds,
          })
          .eq('video_id', videoId)

        if (analyticsError) {
          console.error('Error updating generation analytics for timeout:', analyticsError)
        }

        return NextResponse.json({
          id: video.id,
          status: 'FAILED',
          errorReason: 'Video generation timed out after 60 minutes',
        })
      }
    }

    // Extract duration and creation time from video metadata
    const videoDuration = (video.input_metadata as any)?.duration || undefined
    const createdAt = video.created_at || undefined

    // 6. If status is already COMPLETED or FAILED, return immediately (no external call)
    if (video.status === 'COMPLETED' || video.status === 'FAILED') {
      return NextResponse.json({
        id: video.id,
        status: video.status,
        videoUrl: video.video_url || undefined,
        errorReason: video.error_reason || undefined,
        duration: videoDuration,
        createdAt,
      })
    }

    // 7. If status is PROCESSING, check Kie.ai status
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
          // Try to download and store video in Supabase Storage
          let storagePath: string | null = null
          let signedUrl: string | null = null

          try {
            storagePath = await storeVideoFromKie(kieStatus.videoUrl, user.id, videoId)
            
            if (storagePath) {
              // Generate signed URL for the stored video
              signedUrl = await getSignedVideoUrl(storagePath)
            }
          } catch (storageError) {
            console.error('Error storing video in Supabase Storage:', storageError)
            // Continue with Kie.ai URL as fallback
          }

          // Update video record with completed status, URL, and storage path
          const updateData: {
            status: 'COMPLETED'
            video_url: string
            updated_at: string
            storage_path?: string | null
          } = {
            status: 'COMPLETED',
            video_url: kieStatus.videoUrl,
            updated_at: new Date().toISOString(),
          }

          if (storagePath) {
            updateData.storage_path = storagePath
          }

          const { error: updateError } = await adminClient
            .from('videos')
            .update(updateData)
            .eq('id', videoId)

          if (updateError) {
            console.error('Error updating video:', updateError)
            // Still return the status even if update fails
          }

          // Update analytics record with completion
          const completedAt = new Date().toISOString()
          const generationTimeSeconds = createdAt 
            ? Math.floor((new Date(completedAt).getTime() - new Date(createdAt).getTime()) / 1000)
            : null

          // Note: generation_analytics table is new and may not be in TypeScript types yet
          const { error: analyticsError } = await (adminClient as any)
            .from('generation_analytics')
            .update({
              status: 'COMPLETED',
              completed_at: completedAt,
              generation_time_seconds: generationTimeSeconds,
            })
            .eq('video_id', videoId)

          if (analyticsError) {
            // Log error but don't fail the request - analytics is non-critical
            console.error('Error updating generation analytics:', analyticsError)
          }

          // 8. Post-generation quality validation
          try {
            // Extract requested duration from video metadata for validation
            const requestedDuration = (video.input_metadata as any)?.duration || videoDuration

            // Validate video quality
            const validationResult = await validateVideoQuality(
              signedUrl || kieStatus.videoUrl,
              requestedDuration,
              undefined, // actualDuration not available from Kie.ai response
              kieStatus // pass the full status response for potential metadata
            )

            // Update video record with quality metrics
            const { error: qualityUpdateError } = await adminClient
              .from('videos')
              .update({
                quality_score: validationResult.score,
                quality_issues: validationResult.issues,
                quality_validated_at: validationResult.validatedAt,
              } as any)
              .eq('id', videoId)

            if (qualityUpdateError) {
              console.error('Error updating video with quality metrics:', qualityUpdateError)
            }

            // 9. Auto-regeneration or refund logic for quality failures
            if (shouldAutoRefund(validationResult.score)) {
              console.log(`[Quality Validation] Video ${videoId} failed quality check (score: ${validationResult.score}). Auto-regenerate: ${autoRegenerateEnabled}`)

              // Check if auto-regeneration is enabled and video hasn't been regenerated before
              const videoMetadata = video.input_metadata as any
              const isAlreadyRegenerated = videoMetadata?.is_regeneration === true
              const regenerationCount = videoMetadata?.regeneration_count || 0

              if (autoRegenerateEnabled && !isAlreadyRegenerated && regenerationCount < 1) {
                console.log(`[Auto-Regeneration] Attempting regeneration for video ${videoId}`)

                try {
                  // Extract original parameters for regeneration
                  const originalPrompt = video.final_script || videoMetadata?.script || ''
                  const imageUrls = videoMetadata?.images || []
                  const originalStyle = videoMetadata?.format?.split('_')?.[0] || 'ugc'
                  const originalDuration = videoMetadata?.duration || videoDuration
                  const originalFormat = videoMetadata?.format || 'ugc_auth_15s'

                  // Re-analyze content to get current risk level
                  const qualityRiskLevel = analyzeContentForQuality(originalPrompt, imageUrls)

                  // Select a better model for regeneration (force premium models for quality)
                  const regenerationModel = selectModelForQualityRisk(originalFormat, qualityRiskLevel, 'premium')

                  console.log(`[Auto-Regeneration] Original model: ${videoMetadata?.model}, New model: ${regenerationModel.id}, Risk: ${qualityRiskLevel}`)

                  // Trigger regeneration with enhanced parameters
                  const newKieTaskId = await createVideoTask({
                    script: originalPrompt,
                    imageUrls,
                    aspectRatio: videoMetadata?.aspect_ratio || 'portrait',
                    duration: originalDuration,
                    model: regenerationModel.kieApiModelName,
                    riskLevel: qualityRiskLevel,
                    qualityTier: 'premium' // Force premium tier for regeneration
                  })

                  // Update video record for regeneration
                  const { error: regenerationUpdateError } = await adminClient
                    .from('videos')
                    .update({
                      status: 'PROCESSING',
                      kie_task_id: newKieTaskId,
                      input_metadata: {
                        ...videoMetadata,
                        is_regeneration: true,
                        regeneration_count: regenerationCount + 1,
                        original_video_id: videoId,
                        regeneration_reason: `Quality validation failed (score: ${validationResult.score})`,
                        original_quality_score: validationResult.score,
                        original_quality_issues: validationResult.issues,
                        regeneration_model: regenerationModel.id,
                        regeneration_timestamp: new Date().toISOString()
                      } as any,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', videoId)

                  if (regenerationUpdateError) {
                    console.error('Error updating video for regeneration:', regenerationUpdateError)
                    // Fall back to refund if regeneration update fails
                    throw new Error('Failed to update video for regeneration')
                  }

                  // Update analytics with regeneration attempt
                  const { error: analyticsRegenerationError } = await (adminClient as any)
                    .from('generation_analytics')
                    .update({
                      status: 'PROCESSING',
                      regeneration_attempted: true,
                      regeneration_reason: `Quality validation failed (score: ${validationResult.score})`,
                      regeneration_model: regenerationModel.id
                    })
                    .eq('video_id', videoId)

                  if (analyticsRegenerationError) {
                    console.error('Error updating analytics for regeneration:', analyticsRegenerationError)
                  }

                  console.log(`[Auto-Regeneration] Successfully initiated regeneration for video ${videoId} with model ${regenerationModel.id}`)

                  // Return processing status for regeneration
                  return NextResponse.json({
                    id: video.id,
                    status: 'PROCESSING',
                    message: 'Video quality was below threshold. Auto-regeneration initiated with enhanced settings.',
                    qualityScore: validationResult.score,
                    qualityIssues: validationResult.issues,
                    regenerationModel: regenerationModel.id,
                    duration: videoDuration,
                    createdAt,
                  })

                } catch (regenerationError) {
                  console.error(`[Auto-Regeneration] Failed to regenerate video ${videoId}:`, regenerationError)
                  // Fall back to refund if regeneration fails
                }
              }

              // If auto-regeneration is not enabled or failed, proceed with refund
              console.log(`[Quality Validation] Video ${videoId} failed quality check (score: ${validationResult.score}). Initiating refund.`)

              // Update video status to indicate quality failure
              const qualityErrorReason = `Quality validation failed: ${getQualityIssuesSummary(validationResult.issues)}`

              const { error: statusUpdateError } = await adminClient
                .from('videos')
                .update({
                  status: 'FAILED',
                  error_reason: qualityErrorReason,
                })
                .eq('id', videoId)

              if (statusUpdateError) {
                console.error('Error updating video status for quality failure:', statusUpdateError)
              }

              // Create REFUND transaction to restore the credit
              const videoCostCredits = (video.input_metadata as any)?.costCredits || 1
              const { error: refundError } = await adminClient.from('transactions').insert({
                user_id: user.id,
                amount: videoCostCredits,
                type: 'REFUND',
                provider: 'SYSTEM',
                payment_id: null,
                metadata: {
                  video_id: videoId,
                  reason: 'Quality validation failed',
                  quality_score: validationResult.score,
                  quality_issues: validationResult.issues,
                  original_cost_credits: videoCostCredits,
                  auto_regenerate_attempted: autoRegenerateEnabled,
                } as any,
              })

              if (refundError) {
                console.error('CRITICAL: Error creating refund transaction for quality failure:', refundError)
              }

              // Update analytics record with quality failure
              const { error: analyticsQualityError } = await (adminClient as any)
                .from('generation_analytics')
                .update({
                  status: 'FAILED',
                  error_reason: qualityErrorReason,
                })
                .eq('video_id', videoId)

              if (analyticsQualityError) {
                console.error('Error updating generation analytics for quality failure:', analyticsQualityError)
              }

              // Return failed status with quality issues
              return NextResponse.json({
                id: video.id,
                status: 'FAILED',
                errorReason: qualityErrorReason,
                qualityScore: validationResult.score,
                qualityIssues: validationResult.issues,
                autoRegenerateAttempted: autoRegenerateEnabled,
                duration: videoDuration,
                createdAt,
              })
            }

            // Video passed quality validation - return success with quality metrics
            return NextResponse.json({
              id: video.id,
              status: 'COMPLETED',
              videoUrl: signedUrl || kieStatus.videoUrl,
              duration: videoDuration,
              createdAt,
              qualityScore: validationResult.score,
              qualityIssues: validationResult.issues,
            })
          } catch (validationError) {
            // Log validation error but don't fail the request - quality validation is non-critical for delivery
            console.error('Error during quality validation:', validationError)

            // Return success response without quality metrics
            return NextResponse.json({
              id: video.id,
              status: 'COMPLETED',
              videoUrl: signedUrl || kieStatus.videoUrl,
              duration: videoDuration,
              createdAt,
              qualityValidationError: validationError instanceof Error ? validationError.message : 'Quality validation failed',
            })
          }
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
          // Get actual cost from video metadata
          const videoCostCredits = (video.input_metadata as any)?.costCredits || 1
          const { error: refundError } = await adminClient.from('transactions').insert({
            user_id: user.id,
            amount: videoCostCredits, // Refund actual cost
            type: 'REFUND',
            provider: 'SYSTEM',
            payment_id: null,
            metadata: {
              video_id: videoId,
              reason: 'Video generation failed',
              original_cost_credits: videoCostCredits,
              error_message: errorReason,
            } as any,
          })

          if (refundError) {
            console.error('CRITICAL: Error creating refund transaction:', refundError)
            // Log this as a critical error - credit was deducted but refund failed
            // In production, you might want to alert admins about this
          }

          // Update analytics record with failure
          const completedAt = new Date().toISOString()
          const generationTimeSeconds = createdAt 
            ? Math.floor((new Date(completedAt).getTime() - new Date(createdAt).getTime()) / 1000)
            : null

          // Note: generation_analytics table is new and may not be in TypeScript types yet
          const { error: analyticsError } = await (adminClient as any)
            .from('generation_analytics')
            .update({
              status: 'FAILED',
              completed_at: completedAt,
              error_reason: errorReason,
              generation_time_seconds: generationTimeSeconds,
            })
            .eq('video_id', videoId)

          if (analyticsError) {
            // Log error but don't fail the request - analytics is non-critical
            console.error('Error updating generation analytics:', analyticsError)
          }

          return NextResponse.json({
            id: video.id,
            status: 'FAILED',
            errorReason,
            duration: videoDuration,
            createdAt,
          })
        } else {
          // Still processing (PROCESSING status)
          return NextResponse.json({
            id: video.id,
            status: 'PROCESSING',
            progress: kieStatus.progress,
            duration: videoDuration,
            createdAt,
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
          duration: videoDuration,
          createdAt,
        })
      }
    }

    // 8. For any other status (DRAFT, SCRIPT_GENERATED), return as-is
    return NextResponse.json({
      id: video.id,
      status: video.status,
      duration: videoDuration,
      createdAt,
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

