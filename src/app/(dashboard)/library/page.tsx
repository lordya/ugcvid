import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { LibraryClient } from '@/components/dashboard/LibraryClient'
import { EmptyState } from '@/components/onboarding/EmptyState'
import { LibraryOnboarding } from '@/components/onboarding/LibraryOnboarding'

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
            <h1 className="text-4xl font-semibold mb-2 text-white">Library</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.email}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/wizard">
              <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90">
                Create Video
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Header */}
        <DashboardStats userId={user.id} />

        {/* Welcome Modal (only shows if no videos and hasn't been dismissed) */}
        <LibraryOnboarding videoCount={videos?.length || 0} />

        {/* Video Grid with Toolbar */}
        {!hasVideos ? (
          <div className="rounded-lg border border-border bg-[#161B22]">
            <EmptyState />
          </div>
        ) : (
          <LibraryClient
            videos={videos.map((video) => ({
              id: video.id,
              status: video.status as 'DRAFT' | 'SCRIPT_GENERATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
              video_url: video.video_url,
              final_script: video.final_script,
              input_metadata: video.input_metadata as {
                title?: string
                description?: string
                images?: string[]
              } | null,
              created_at: video.created_at,
            }))}
          />
        )}
      </div>
    </main>
  )
}

