import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createVideoTask } from '@/lib/kie'

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
    const body = await request.json()
    const { script, imageUrls, aspectRatio = '9:16' } = body

    // Validate inputs
    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required' }, { status: 400 })
    }

    // 3. Use admin client for atomic transaction
    const adminClient = createAdminClient()

    // 4. Check user's credit balance (must be > 0)
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (userData.credits_balance <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // 5. Prepare metadata for video record
    const inputMetadata = {
      title: body.title || null,
      description: body.description || null,
      images: imageUrls,
    }

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

    // 7. Create GENERATION transaction (amount: -1)
    // This will automatically deduct 1 credit via database trigger
    const { error: transactionError } = await adminClient.from('transactions').insert({
      user_id: user.id,
      amount: -1,
      type: 'GENERATION' as const,
      provider: 'SYSTEM' as const,
      payment_id: null,
    })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // If transaction fails, we should delete the video record we just created
      await adminClient.from('videos').delete().eq('id', videoRecord.id)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // 8. Call Kie.ai API to create the video task
    let kieTaskId: string
    try {
      kieTaskId = await createVideoTask({
        script,
        imageUrls,
        aspectRatio,
      })
    } catch (kieError) {
      console.error('Kie.ai API error:', kieError)

      // 9. If Kie.ai fails, create a REFUND transaction to restore the credit
      const { error: refundError } = await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: 1, // Positive amount to refund
        type: 'REFUND' as const,
        provider: 'SYSTEM' as const,
        payment_id: null,
      })

      if (refundError) {
        console.error('Error creating refund transaction:', refundError)
        // Log this as a critical error - credit was deducted but refund failed
        // In production, you might want to alert admins about this
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

    // 10. Update video record with kie_task_id
    const { error: updateError } = await adminClient
      .from('videos')
      .update({
        kie_task_id: kieTaskId,
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

