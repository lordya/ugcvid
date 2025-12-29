import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { kieCircuitBreaker } from '@/lib/circuit-breaker'

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
 * Admin API endpoint for generation statistics
 * Returns analytics data for monitoring video generation performance
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

    // 2. Check if user is admin (using ADMIN_EMAILS env variable)
    const isAdmin = await checkAdminAccess(user.email)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // 3. Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10) // Default to last 7 days
    const format = searchParams.get('format') || null
    const model = searchParams.get('model') || null

    // 4. Build query for analytics
    let query = adminClient
      .from('generation_analytics')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (format) {
      query = query.eq('format', format)
    }
    if (model) {
      query = query.eq('model', model)
    }

    const { data: analytics, error: analyticsError } = await query.order('created_at', { ascending: false })

    if (analyticsError) {
      console.error('Error fetching generation analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // 5. Calculate statistics
    const total = analytics?.length || 0
    const completed = analytics?.filter((a: any) => a.status === 'COMPLETED').length || 0
    const failed = analytics?.filter((a: any) => a.status === 'FAILED').length || 0
    const processing = analytics?.filter((a: any) => a.status === 'PROCESSING').length || 0

    const successRate = total > 0 ? (completed / total) * 100 : 0

    // Group by format
    const byFormat: Record<string, { total: number; completed: number; failed: number; successRate: number }> = {}
    analytics?.forEach((a: any) => {
      if (!byFormat[a.format]) {
        byFormat[a.format] = { total: 0, completed: 0, failed: 0, successRate: 0 }
      }
      byFormat[a.format].total++
      if (a.status === 'COMPLETED') byFormat[a.format].completed++
      if (a.status === 'FAILED') byFormat[a.format].failed++
    })
    Object.keys(byFormat).forEach(format => {
      byFormat[format].successRate = byFormat[format].total > 0
        ? (byFormat[format].completed / byFormat[format].total) * 100
        : 0
    })

    // Group by model
    const byModel: Record<string, { total: number; completed: number; failed: number; successRate: number }> = {}
    analytics?.forEach((a: any) => {
      if (!byModel[a.model]) {
        byModel[a.model] = { total: 0, completed: 0, failed: 0, successRate: 0 }
      }
      byModel[a.model].total++
      if (a.status === 'COMPLETED') byModel[a.model].completed++
      if (a.status === 'FAILED') byModel[a.model].failed++
    })
    Object.keys(byModel).forEach(model => {
      byModel[model].successRate = byModel[model].total > 0
        ? (byModel[model].completed / byModel[model].total) * 100
        : 0
    })

    // Failure reasons breakdown
    const failureReasons: Record<string, number> = {}
    analytics?.filter((a: any) => a.status === 'FAILED' && a.error_reason).forEach((a: any) => {
      const reason = a.error_reason || 'Unknown'
      failureReasons[reason] = (failureReasons[reason] || 0) + 1
    })

    // Average generation times
    const completedAnalytics = analytics?.filter((a: any) => a.status === 'COMPLETED' && a.generation_time_seconds) || []
    const avgGenerationTime = completedAnalytics.length > 0
      ? completedAnalytics.reduce((sum: number, a: any) => sum + (a.generation_time_seconds || 0), 0) / completedAnalytics.length
      : null

    // Credit refund statistics
    const { data: refundTransactions, error: refundError } = await adminClient
      .from('transactions')
      .select('*')
      .eq('type', 'REFUND')
      .eq('provider', 'SYSTEM')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    const totalRefunds = refundTransactions?.length || 0
    const totalRefundCredits = refundTransactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

    // Recent failures (last 20)
    const recentFailures = analytics
      ?.filter((a: any) => a.status === 'FAILED')
      .slice(0, 20)
      .map((a: any) => ({
        id: a.id,
        video_id: a.video_id,
        user_id: a.user_id,
        format: a.format,
        model: a.model,
        error_reason: a.error_reason,
        created_at: a.created_at,
        completed_at: a.completed_at,
      })) || []

    return NextResponse.json({
      summary: {
        total,
        completed,
        failed,
        processing,
        successRate: Math.round(successRate * 100) / 100,
        avgGenerationTimeSeconds: avgGenerationTime ? Math.round(avgGenerationTime) : null,
      },
      byFormat,
      byModel,
      failureReasons,
      refunds: {
        totalRefunds,
        totalRefundCredits,
      },
      recentFailures,
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      },
      circuitBreaker: kieCircuitBreaker.getStatus(),
    })
  } catch (error) {
    console.error('Generation stats API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

