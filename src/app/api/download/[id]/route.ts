import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getSignedVideoUrl } from '@/lib/video-storage'

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

    // 4. Check if video is completed
    if (video.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Video is not ready for download' },
        { status: 400 }
      )
    }

    // 5. Determine video URL: prefer Supabase Storage, fallback to Kie.ai URL
    let videoUrl: string | null = null

    // Check if video is stored in Supabase Storage
    if (video.storage_path) {
      try {
        const signedUrl = await getSignedVideoUrl(video.storage_path)
        if (signedUrl) {
          videoUrl = signedUrl
        }
      } catch (error) {
        console.error('Error generating signed URL for storage:', error)
        // Fall through to Kie.ai URL fallback
      }
    }

    // Fallback to Kie.ai URL if storage is not available
    if (!videoUrl && video.video_url) {
      videoUrl = video.video_url
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is not available' },
        { status: 404 }
      )
    }

    // 6. Fetch the video file from the URL
    const videoResponse = await fetch(videoUrl)

    if (!videoResponse.ok) {
      console.error('Failed to fetch video from URL:', videoResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch video file' },
        { status: 502 }
      )
    }

    // 7. Get the video blob
    const videoBlob = await videoResponse.blob()

    // 8. Stream the video to the client with proper headers
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

