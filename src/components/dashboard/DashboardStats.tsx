import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardStatsProps {
  userId: string
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const supabase = await createClient()

  // Fetch user credits
  const { data: userData } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', userId)
    .single()

  const credits = userData?.credits_balance || 0

  // Fetch total videos count
  const { count: totalVideos } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Fetch videos this month (created_at >= start of current month)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMonthISO = startOfMonth.toISOString()

  const { count: videosThisMonth } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonthISO)

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-white">Recent Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Credits Left */}
        <Card className="bg-[#161B22] border-border">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">
                Credits Left
              </span>
              <span className="text-2xl font-semibold text-white font-mono">
                {credits}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Videos this Month */}
        <Card className="bg-[#161B22] border-border">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">
                Videos this Month
              </span>
              <span className="text-2xl font-semibold text-white font-mono">
                {videosThisMonth || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Generated */}
        <Card className="bg-[#161B22] border-border">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">
                Total Generated
              </span>
              <span className="text-2xl font-semibold text-white font-mono">
                {totalVideos || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

