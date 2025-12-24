import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createVideoTask } from '@/lib/kie'
import { getFormatKey, selectModelForFormat, calculateVideoCost, usdToCredits } from '@/lib/kie-models'
import { UGCContent, Json } from '@/types/supabase'

interface BatchGenerateRequest {
  itemIds: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: BatchGenerateRequest = await request.json()
    const { itemIds } = body

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required and cannot be empty' }, { status: 400 })
    }

    // Verify batch belongs to user and get batch details
    const { data: batch, error: batchError } = await supabase
      .from('video_batches')
      .select('*')
      .eq('id', batchId)
      .eq('user_id', user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get the selected batch items
    const { data: batchItems, error: itemsError } = await supabase
      .from('batch_video_items')
      .select('*')
      .eq('batch_id', batchId)
      .in('id', itemIds)
      .eq('status', 'completed') // Only allow generation for completed items
      .is('video_id', null) // Only items without existing videos

    if (itemsError) {
      console.error('Error fetching batch items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch batch items' }, { status: 500 })
    }

    if (!batchItems || batchItems.length === 0) {
      return NextResponse.json({ error: 'No valid items found for generation' }, { status: 400 })
    }

    if (batchItems.length !== itemIds.length) {
      return NextResponse.json({
        error: 'Some items are not eligible for generation (already processed or not completed)'
      }, { status: 400 })
    }

    // Use admin client for atomic operations
    const adminClient = createAdminClient()

    // Calculate total credits needed
    const totalCreditsNeeded = batchItems.reduce((sum, item) => sum + (item.credits_used || 1), 0)

    // Check user's credit balance
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (userData.credits_balance < totalCreditsNeeded) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${totalCreditsNeeded}, have ${userData.credits_balance}`
      }, { status: 402 })
    }

    const results = []
    const errors = []

    // Process each item
    for (const item of batchItems) {
      try {
        // Determine format and model (using defaults from batch item or fallback)
        const style = item.style || 'ugc_auth'
        const duration = '30s' // Default duration
        const format = getFormatKey(style, duration)
        const selectedModel = selectModelForFormat(format)
        const targetDuration = 30

        // Create video record
        const { data: videoRecord, error: videoError } = await adminClient
          .from('videos')
          .insert({
            user_id: user.id,
            status: 'PROCESSING',
            final_script: item.script || item.metadata?.script || '',
            input_metadata: {
              batch_id: batchId,
              batch_item_id: item.id,
              row_index: item.row_index,
              source_url: item.url,
              custom_title: item.custom_title,
              style: style,
              duration: targetDuration,
              model: selectedModel.id,
              format,
              bulk_generated: true,
            } as Json,
            kie_task_id: null,
          })
          .select()
          .single()

        if (videoError || !videoRecord) {
          console.error('Error creating video record for item:', item.id, videoError)
          errors.push({ itemId: item.id, error: 'Failed to create video record' })
          continue
        }

        // Create Kie.ai task
        let kieTaskId: string
        try {
          // Prepare images (this would need to be enhanced to handle actual images)
          const imageUrls: string[] = [] // TODO: Get images from item metadata

          kieTaskId = await createVideoTask({
            script: item.script || '',
            imageUrls: imageUrls,
            aspectRatio: 'portrait',
            duration: targetDuration,
            model: selectedModel.kieApiModelName,
          })
        } catch (kieError) {
          console.error('Kie.ai API error for item:', item.id, kieError)

          // Update video record to FAILED
          await adminClient
            .from('videos')
            .update({
              status: 'FAILED',
              error_reason: kieError instanceof Error ? kieError.message : 'Kie.ai API call failed',
            })
            .eq('id', videoRecord.id)

          errors.push({ itemId: item.id, error: 'Failed to start video generation' })
          continue
        }

        // Update video record with task ID
        await adminClient
          .from('videos')
          .update({ kie_task_id: kieTaskId })
          .eq('id', videoRecord.id)

        // Update batch item with video ID
        await adminClient
          .from('batch_video_items')
          .update({
            video_id: videoRecord.id,
            status: 'PROCESSING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        results.push({
          itemId: item.id,
          videoId: videoRecord.id,
          taskId: kieTaskId,
        })

      } catch (itemError) {
        console.error('Error processing item:', item.id, itemError)
        errors.push({
          itemId: item.id,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    // Create transaction for all credits used
    if (results.length > 0) {
      const creditsUsed = results.length // Assuming 1 credit per video
      const { error: transactionError } = await adminClient
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: -creditsUsed,
          type: 'GENERATION',
          provider: 'SYSTEM',
          payment_id: `batch_generation_${batchId}`,
          metadata: {
            batch_id: batchId,
            items_processed: results.length,
            credits_used: creditsUsed,
          } as Json
        })

      if (transactionError) {
        console.error('Error creating transaction:', transactionError)
        // Continue anyway - the videos were created successfully
      }
    }

    // Navigate to processing page
    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Batch generation API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
