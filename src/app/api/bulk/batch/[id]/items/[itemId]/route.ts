import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const batchId = params.id
    const itemId = params.itemId

    if (!batchId || !itemId) {
      return NextResponse.json({ error: 'Batch ID and Item ID are required' }, { status: 400 })
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

    // Verify the batch belongs to the user
    const { data: batch, error: batchError } = await supabase
      .from('video_batches')
      .select('id, user_id')
      .eq('id', batchId)
      .eq('user_id', user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Get the batch item details before deletion
    const { data: item, error: itemError } = await supabase
      .from('batch_video_items')
      .select('id, credits_used, video_id')
      .eq('id', itemId)
      .eq('batch_id', batchId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Batch item not found' }, { status: 404 })
    }

    // Check if item has already been processed (has a video)
    if (item.video_id) {
      return NextResponse.json({
        error: 'Cannot delete item that has already been processed into a video'
      }, { status: 400 })
    }

    // Start a transaction to delete the item and refund credits
    const { error: deleteError } = await supabase.rpc('delete_batch_item_with_refund', {
      p_batch_id: batchId,
      p_item_id: itemId,
      p_user_id: user.id
    })

    if (deleteError) {
      console.error('Error deleting batch item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete batch item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete batch item API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
