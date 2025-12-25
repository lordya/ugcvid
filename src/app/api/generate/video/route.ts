import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createVideoTask } from '@/lib/kie'
import { getFormatKey, selectModelForFormat, calculateVideoCost, usdToCredits } from '@/lib/kie-models'
import { VideoGenerationRequest, UGCContent, Json } from '@/types/supabase'
import { kieCircuitBreaker } from '@/lib/circuit-breaker'
import { validateStyleDuration } from '@/lib/validation'

export async function POST(request: NextRequest) {
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

    // 2. Parse request body
    const body: VideoGenerationRequest = await request.json()
    const { script, imageUrls, aspectRatio = 'portrait', ugcContent, style, duration } = body

    // 2.1. Validate style and duration if provided
    if (style && duration) {
      const validation = validateStyleDuration(style, duration)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid style or duration combination' },
          { status: 400 }
        )
      }
    }

    // Validate inputs - accept either script or ugcContent
    let finalPrompt: string;
    let finalAspectRatio = aspectRatio;
    let finalTitle = body.title;
    let finalDescription = body.description;

    if (ugcContent && ugcContent.Prompt) {
      // Use structured UGC content from n8n workflow format
      finalPrompt = ugcContent.Prompt;
      finalAspectRatio = ugcContent.aspect_ratio || 'portrait';
      finalTitle = ugcContent.Title;
      finalDescription = ugcContent.Description;
    } else if (script) {
      // Backward compatibility with simple script
      finalPrompt = script;
    } else {
      return NextResponse.json({ error: 'Either script or ugcContent.Prompt is required' }, { status: 400 })
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required' }, { status: 400 })
    }

    // 2.5. Determine format and select optimal model
    const format = style && duration 
      ? getFormatKey(style, duration) 
      : 'ugc_auth_15s' // Default fallback
    
    const selectedModel = selectModelForFormat(format)
    const targetDuration = duration === '10s' ? 10 : 15
    
    // Calculate actual cost based on model and duration
    const costUsd = calculateVideoCost(selectedModel, targetDuration)
    const costCredits = usdToCredits(costUsd)
    
    console.log(`[Video Generation] Format: ${format}, Model: ${selectedModel.name}, Duration: ${targetDuration}s, Cost: $${costUsd.toFixed(4)} (${costCredits} credits)`)

    // 3. Use admin client for atomic transaction
    const adminClient = createAdminClient()

    // 4. Check user's credit balance (must be >= costCredits)
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (userData.credits_balance < costCredits) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${costCredits}, have ${userData.credits_balance}` 
      }, { status: 402 })
    }

    // 5. Prepare metadata for video record
    const inputMetadata = {
      title: finalTitle || body.title || null,
      description: finalDescription || body.description || null,
      images: imageUrls,
      ugcContent: ugcContent || null, // Store the full UGC content structure
      model: selectedModel.id,
      format,
      duration: targetDuration,
      costUsd,
      costCredits,
    } as Json

    // 6. Create video record first (status: PROCESSING)
    // We'll update it with kie_task_id after successful API call
    const { data: videoRecord, error: videoError } = await adminClient
      .from('videos')
      .insert({
        user_id: user.id,
        status: 'PROCESSING' as const,
        final_script: script,
        input_metadata: inputMetadata,
        kie_task_id: null, // Will be updated after Kie.ai call
      })
      .select()
      .single()

    if (videoError || !videoRecord) {
      console.error('Error creating video record:', videoError)
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
    }

    // 7. Create GENERATION transaction with actual cost
    // This will automatically deduct costCredits via database trigger
    // Note: Video record is created first to ensure we have a video_id for transaction metadata
    const { error: transactionError } = await adminClient.from('transactions').insert({
      user_id: user.id,
      amount: -costCredits, // Dynamic cost instead of fixed -1
      type: 'GENERATION' as const,
      provider: 'SYSTEM' as const, // System-generated transaction for video generation
      payment_id: null,
      metadata: { 
        video_id: videoRecord.id, // Link transaction to video for traceability
        model: selectedModel.id, 
        modelName: selectedModel.name,
        format,
        duration: targetDuration,
        costUsd,
        costCredits
      } as Json
    })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // If transaction fails, we should delete the video record we just created
      // This ensures no orphaned video records exist without corresponding transactions
      await adminClient.from('videos').delete().eq('id', videoRecord.id)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // 7.5. Log generation start in analytics
    // Note: generation_analytics table is new and may not be in TypeScript types yet
    const { error: analyticsError } = await (adminClient as any).from('generation_analytics').insert({
      video_id: videoRecord.id,
      user_id: user.id,
      format,
      model: selectedModel.id,
      duration: targetDuration,
      status: 'PROCESSING',
      cost_credits: costCredits,
      cost_usd: costUsd,
      circuit_breaker_state: kieCircuitBreaker.getState(),
    })

    if (analyticsError) {
      // Log error but don't fail the request - analytics is non-critical
      console.error('Error logging generation analytics:', analyticsError)
    }

    // 8. Call Kie.ai API to create the video task with selected model
    let kieTaskId: string
    try {
      kieTaskId = await createVideoTask({
        script: finalPrompt,
        imageUrls,
        aspectRatio: finalAspectRatio,
        duration: targetDuration, // Pass calculated duration
        model: selectedModel.kieApiModelName, // Use selected model
      })
    } catch (kieError) {
      console.error('Kie.ai API error:', kieError)

      // 9. If Kie.ai fails, create a REFUND transaction to restore the actual cost
      // This is critical - credits were already deducted, so refund must succeed
      const { error: refundError } = await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: costCredits, // Refund actual cost instead of fixed 1
        type: 'REFUND' as const,
        provider: 'SYSTEM' as const,
        payment_id: null,
        metadata: { 
          video_id: videoRecord.id, // Link refund to video for traceability
          reason: 'Kie.ai API failure', 
          originalModel: selectedModel.id,
          originalCostUsd: costUsd,
          originalCostCredits: costCredits,
          error_message: kieError instanceof Error ? kieError.message : 'Unknown error'
        } as Json
      })

      if (refundError) {
        // CRITICAL: Credit was deducted but refund failed - this is a data integrity issue
        console.error('CRITICAL: Error creating refund transaction after Kie.ai failure:', {
          refundError,
          videoId: videoRecord.id,
          userId: user.id,
          costCredits,
          originalError: kieError instanceof Error ? kieError.message : 'Unknown error'
        })
        // In production, this should trigger an alert to admins
        // The video record will be marked as FAILED, but credits may be lost
        // Admin intervention required to manually refund credits
      }

      // Update video record to FAILED status
      await adminClient
        .from('videos')
        .update({
          status: 'FAILED' as const,
          error_reason: kieError instanceof Error ? kieError.message : 'Kie.ai API call failed',
        })
        .eq('id', videoRecord.id)

      return NextResponse.json(
        {
          error: 'Failed to start video generation',
          details: kieError instanceof Error ? kieError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    // 10. Update video record with kie_task_id (metadata already includes model info)
    const { error: updateError } = await adminClient
      .from('videos')
      .update({
        kie_task_id: kieTaskId,
        input_metadata: inputMetadata, // Ensure model info is stored
      })
      .eq('id', videoRecord.id)

    if (updateError) {
      console.error('Error updating video with task_id:', updateError)
      // This is not critical - the video record exists and Kie.ai job is running
      // We can still return success, but log the error
    }

    // 11. Return success response
    return NextResponse.json({
      videoId: videoRecord.id,
      status: 'PROCESSING',
      task_id: kieTaskId,
    })
  } catch (error) {
    console.error('Video generation API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

