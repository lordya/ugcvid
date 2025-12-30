import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { scriptId } = await request.json()

    if (!scriptId) {
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // First, get the video_id for this script to ensure user owns it
    const { data: scriptData, error: scriptError } = await supabase
      .from('video_scripts')
      .select('video_id')
      .eq('id', scriptId)
      .single()

    if (scriptError || !scriptData) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      )
    }

    // Verify the user owns the video
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', scriptData.video_id)
      .single()

    if (videoError || !videoData || videoData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update all scripts for this video to not selected, then select the chosen one
    // Use a transaction-like approach with individual queries
    const { error: deselectError } = await supabase
      .from('video_scripts')
      .update({ is_selected: false })
      .eq('video_id', scriptData.video_id)

    if (deselectError) {
      console.error('Error deselecting scripts:', deselectError)
      return NextResponse.json(
        { error: 'Failed to update script selection' },
        { status: 500 }
      )
    }

    const { error: selectError } = await supabase
      .from('video_scripts')
      .update({ is_selected: true })
      .eq('id', scriptId)

    if (selectError) {
      console.error('Error selecting script:', selectError)
      return NextResponse.json(
        { error: 'Failed to update script selection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Script selection API error:', error)
    return NextResponse.json(
      { error: 'Failed to update script selection' },
      { status: 500 }
    )
  }
}
