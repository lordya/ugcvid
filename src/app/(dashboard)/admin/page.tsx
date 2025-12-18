import { getSystemStats } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboardPage() {
  const { stats, error } = await getSystemStats()

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

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-muted bg-muted/10 p-4 text-muted-foreground">
          <h2 className="text-lg font-semibold">No Data</h2>
          <p>Unable to load system statistics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground mt-2">
          High-level system statistics and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Total Videos Card */}
        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Videos Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono tracking-tight">
              {stats.totalVideos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Credits Consumed Card */}
        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Credits Consumed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono tracking-tight">
              {stats.creditsConsumed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

