import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { VideoCard } from '@/components/VideoCard'
import Link from 'next/link'
import { VideoStatus } from '@/hooks/useVideoStatus'

interface VideoInputMetadata {
  title?: string
  description?: string
  images?: string[]
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's videos
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (videosError) {
    console.error('Error fetching videos:', videosError)
  }

  const hasVideos = videos && videos.length > 0

  return (
    <main className="min-h-screen bg-[#0A0E14] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Library</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.email}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/wizard">
              <Button className="bg-primary hover:bg-primary/90">
                Create Video
              </Button>
            </Link>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="bg-[#161B22] border-border hover:bg-[#1F2937]"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {!hasVideos ? (
          <div className="rounded-lg border bg-[#161B22] p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              Your video library is empty—let&apos;s create something
            </p>
            <Link href="/wizard">
              <Button className="bg-primary hover:bg-primary/90">
                Create Your First Video
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                initialStatus={video.status as VideoStatus}
                inputMetadata={(video.input_metadata as VideoInputMetadata | null) || undefined}
                createdAt={video.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
