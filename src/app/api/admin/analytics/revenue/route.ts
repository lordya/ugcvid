import { NextRequest, NextResponse } from 'next/server'
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
 * GET /api/admin/analytics/revenue - Revenue analytics
 */
export async function GET(request: NextRequest) {
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

    // 3. Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // 4. Fetch data from view
    const { data, error } = await (adminClient as any)
      .from('v_revenue_daily')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching revenue analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    })
  } catch (error) {
    console.error('Revenue analytics API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
