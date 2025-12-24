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

  // Fetch user's videos with batch information
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select(`
      *,
      batch_video_items (
        batch_id,
        row_index,
        video_batches (
          id,
          status
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (videosError) {
    console.error('Error fetching videos:', videosError)
  }

  // Fetch user's recent batches
  const { data: batches, error: batchesError } = await supabase
    .from('video_batches')
    .select(`
      id,
      status,
      total_items,
      processed_items,
      failed_items,
      total_credits_reserved,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (batchesError) {
    console.error('Error fetching batches:', batchesError)
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

        {/* Recent Batches */}
        {batches && batches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Batches</h2>
              <Link href="/wizard?tab=bulk">
                <Button variant="outline" size="sm">
                  Start New Batch
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="rounded-lg border border-border bg-[#161B22] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      Batch #{batch.id.slice(-8)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      batch.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      batch.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                      batch.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {batch.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total Videos:</span>
                      <span>{batch.total_items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="text-green-400">{batch.processed_items - batch.failed_items}</span>
                    </div>
                    {batch.failed_items > 0 && (
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span className="text-red-400">{batch.failed_items}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span>{batch.total_credits_reserved}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                batch_id?: string
                batch_item_row_index?: number
              } | null,
              created_at: video.created_at,
              is_high_performer: video.is_high_performer,
              batchInfo: video.batch_video_items?.[0] ? {
                batchId: video.batch_video_items[0].batch_id,
                rowIndex: video.batch_video_items[0].row_index,
                batchStatus: video.batch_video_items[0].video_batches?.status
              } : null,
            }))}
          />
        )}
      </div>
    </main>
  )
}

