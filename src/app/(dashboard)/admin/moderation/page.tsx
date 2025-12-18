import { getModerationFeed } from '@/app/actions/admin'
import { ModerationFeedGrid } from './moderation-feed-grid'

export default async function AdminModerationPage() {
  const { videos, error } = await getModerationFeed()

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate all generated videos. Block users or delete videos as needed.
        </p>
      </div>
      <ModerationFeedGrid initialVideos={videos} />
    </div>
  )
}

