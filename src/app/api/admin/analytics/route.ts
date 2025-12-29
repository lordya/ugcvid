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
 * Admin API endpoint for analytics data
 * Returns time-series analytics data for admin dashboard charts
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

    // 3. Get query parameters
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'user-growth'
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // 4. Route to appropriate analytics function
    switch (endpoint) {
      case 'user-growth':
        return await getUserGrowthAnalytics(adminClient, startDate, endDate)
      case 'video-trends':
        return await getVideoTrendsAnalytics(adminClient, startDate, endDate)
      case 'credit-usage':
        return await getCreditUsageAnalytics(adminClient, startDate, endDate)
      case 'revenue':
        return await getRevenueAnalytics(adminClient, startDate, endDate)
      case 'model-performance':
        return await getModelPerformanceAnalytics(adminClient, startDate, endDate)
      case 'format-performance':
        return await getFormatPerformanceAnalytics(adminClient, startDate, endDate)
      case 'user-activity':
        return await getUserActivityAnalytics(adminClient, startDate, endDate)
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get user growth analytics
 */
async function getUserGrowthAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_user_growth_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching user growth analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch user growth data' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get video trends analytics
 */
async function getVideoTrendsAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_video_generation_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching video trends analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch video trends data' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get credit usage analytics
 */
async function getCreditUsageAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_credit_consumption_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching credit usage analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch credit usage data' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get revenue analytics
 */
async function getRevenueAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
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
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get model performance analytics
 */
async function getModelPerformanceAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_model_performance_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching model performance analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch model performance data' }, { status: 500 })
  }

  // Group by model for easier chart consumption
  const groupedByModel = (data || []).reduce((acc: any, item: any) => {
    if (!acc[item.model]) {
      acc[item.model] = []
    }
    acc[item.model].push(item)
    return acc
  }, {})

  return NextResponse.json({
    data: data || [],
    groupedByModel,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get format performance analytics
 */
async function getFormatPerformanceAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_format_performance_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching format performance analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch format performance data' }, { status: 500 })
  }

  // Group by format for easier chart consumption
  const groupedByFormat = (data || []).reduce((acc: any, item: any) => {
    if (!acc[item.format]) {
      acc[item.format] = []
    }
    acc[item.format].push(item)
    return acc
  }, {})

  return NextResponse.json({
    data: data || [],
    groupedByFormat,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

/**
 * Get user activity analytics
 */
async function getUserActivityAnalytics(adminClient: any, startDate: Date, endDate: Date) {
  const { data, error } = await adminClient
    .from('v_user_activity_daily')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching user activity analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch user activity data' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}
