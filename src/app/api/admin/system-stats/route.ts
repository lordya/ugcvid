import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

/**
 * Check if the current user is an admin based on ADMIN_EMAILS env variable
 */
async function checkAdminAccess(userEmail: string | undefined): Promise<boolean> {
  if (!userEmail) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  return adminEmails.includes(userEmail)
}

/**
 * GET /api/admin/system-stats - System-wide statistics for admin dashboard
 */
export async function GET() {
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

    // 2. Check if user is admin
    const isAdmin = await checkAdminAccess(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // 3. Get total users count
    const { count: totalUsers, error: usersError } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error fetching total users:', usersError)
      return NextResponse.json({ error: `Failed to fetch users: ${usersError.message}` }, { status: 500 })
    }

    // 4. Get total completed videos count
    const { count: totalVideos, error: videosError } = await adminClient
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')

    if (videosError) {
      console.error('Error fetching total videos:', videosError)
      return NextResponse.json({ error: `Failed to fetch videos: ${videosError.message}` }, { status: 500 })
    }

    // 5. Get credits consumed (sum of ABS(amount) for GENERATION transactions)
    const { data: transactions, error: transactionsError } = await adminClient
      .from('transactions')
      .select('amount')
      .eq('type', 'GENERATION')

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: `Failed to fetch transactions: ${transactionsError.message}` }, { status: 500 })
    }

    const creditsConsumed = transactions
      ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : 0

    // 6. Get model prompts statistics
    const { count: totalPrompts, error: promptsError } = await adminClient
      .from('model_prompts')
      .select('*', { count: 'exact', head: true })

    if (promptsError) {
      console.error('Error fetching total prompts:', promptsError)
      return NextResponse.json({ error: `Failed to fetch prompts: ${promptsError.message}` }, { status: 500 })
    }

    const { count: activePrompts, error: activePromptsError } = await adminClient
      .from('model_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activePromptsError) {
      console.error('Error fetching active prompts:', activePromptsError)
      return NextResponse.json({ error: `Failed to fetch active prompts: ${activePromptsError.message}` }, { status: 500 })
    }

    // 7. Get unique models count
    const { data: uniqueModels, error: uniqueModelsError } = await adminClient
      .from('model_prompts')
      .select('model_id')
      .eq('is_active', true)

    if (uniqueModelsError) {
      console.error('Error fetching unique models:', uniqueModelsError)
      return NextResponse.json({ error: `Failed to fetch unique models: ${uniqueModelsError.message}` }, { status: 500 })
    }

    const promptsByModel = uniqueModels
      ? [...new Set(uniqueModels.map((p: any) => p.model_id))].length
      : 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalVideos: totalVideos || 0,
      creditsConsumed,
      totalPrompts: totalPrompts || 0,
      activePrompts: activePrompts || 0,
      promptsByModel,
    })
  } catch (error) {
    console.error('System stats API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
