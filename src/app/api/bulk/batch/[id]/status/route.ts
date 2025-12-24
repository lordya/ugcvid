import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Get batch details
    const { data: batch, error: batchError } = await supabase
      .from('video_batches')
      .select('*')
      .eq('id', batchId)
      .eq('user_id', user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get batch items with video details
    const { data: items, error: itemsError } = await supabase
      .from('batch_video_items')
      .select(`
        *,
        videos (
          id,
          status,
          video_url,
          error_reason,
          created_at,
          updated_at
        )
      `)
      .eq('batch_id', batchId)
      .order('row_index')

    if (itemsError) {
      console.error('Error fetching batch items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch batch items' }, { status: 500 })
    }

    // Calculate progress
    const totalItems = batch.total_items
    const processedItems = batch.processed_items
    const failedItems = batch.failed_items
    const pendingItems = totalItems - processedItems
    const progress = totalItems > 0 ? (processedItems / totalItems) * 100 : 0

    // Get current processing items
    const processingItems = items.filter(item => item.status === 'PROCESSING')

    return NextResponse.json({
      batch: {
        id: batch.id,
        status: batch.status,
        totalItems,
        processedItems,
        failedItems,
        pendingItems,
        progress: Math.round(progress),
        totalCreditsReserved: batch.total_credits_reserved,
        errorMessage: batch.error_message,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at,
      },
      items: items.map(item => ({
        id: item.id,
        rowIndex: item.row_index,
        url: item.url,
        customTitle: item.custom_title,
        style: item.style,
        status: item.status,
        errorMessage: item.error_message,
        creditsUsed: item.credits_used,
        video: item.videos ? {
          id: item.videos.id,
          status: item.videos.status,
          videoUrl: item.videos.video_url,
          errorReason: item.videos.error_reason,
          createdAt: item.videos.created_at,
          updatedAt: item.videos.updated_at,
        } : null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      processingCount: processingItems.length,
    })

  } catch (error) {
    console.error('Batch status API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
