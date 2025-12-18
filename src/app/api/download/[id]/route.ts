import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

    // 4. Check if video is completed and has a URL
    if (video.status !== 'COMPLETED' || !video.video_url) {
      return NextResponse.json(
        { error: 'Video is not ready for download' },
        { status: 400 }
      )
    }

    // 5. Fetch the video file from the URL
    const videoResponse = await fetch(video.video_url)

    if (!videoResponse.ok) {
      console.error('Failed to fetch video from URL:', videoResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch video file' },
        { status: 502 }
      )
    }

    // 6. Get the video blob
    const videoBlob = await videoResponse.blob()

    // 7. Stream the video to the client with proper headers
    const filename = `afp-ugc-${videoId}.mp4`

    return new NextResponse(videoBlob, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': videoBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

