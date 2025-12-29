import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface QualityAlert {
  id: string
  type: 'quality_degradation' | 'model_performance' | 'regeneration_failure' | 'system_health'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: any
  timestamp: string
  acknowledged: boolean
  acknowledged_at?: string
  acknowledged_by?: string
}

/**
 * GET /api/admin/quality-alerts
 * Returns recent quality alerts and system health status
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Get recent quality alerts (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Check for quality degradation alerts
    const qualityAlerts = await checkQualityDegradation(adminClient)

    // Check for model performance alerts
    const modelAlerts = await checkModelPerformance(adminClient)

    // Check for regeneration failure alerts
    const regenerationAlerts = await checkRegenerationFailures(adminClient)

    // Check for system health alerts
    const systemAlerts = await checkSystemHealth(adminClient)

    // Combine all alerts
    const allAlerts = [
      ...qualityAlerts,
      ...modelAlerts,
      ...regenerationAlerts,
      ...systemAlerts
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      alerts: allAlerts,
      summary: {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        high: allAlerts.filter(a => a.severity === 'high').length,
        medium: allAlerts.filter(a => a.severity === 'medium').length,
        low: allAlerts.filter(a => a.severity === 'low').length,
        unacknowledged: allAlerts.filter(a => !a.acknowledged).length
      }
    })
  } catch (error) {
    console.error('Error fetching quality alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/quality-alerts/:id/acknowledge
 * Acknowledge a quality alert
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    const id = request.nextUrl.pathname.split('/').pop() || ''
    const { acknowledged_by } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    // In a real implementation, you'd store alerts in a database table
    // For now, we'll just return success since this is a monitoring endpoint
    // TODO: Create quality_alerts table to persist alerts

    return NextResponse.json({
      success: true,
      message: `Alert ${id} acknowledged by ${acknowledged_by}`
    })
  } catch (error) {
    console.error('Error acknowledging quality alert:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}

/**
 * Check for quality degradation alerts
 */
async function checkQualityDegradation(adminClient: any): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = []

  try {
    // Get quality metrics for the last 24 hours vs previous 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    // Get recent quality scores
    const { data: recentVideos, error: recentError } = await adminClient
      .from('videos')
      .select('quality_score, created_at')
      .not('quality_score', 'is', null)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })

    if (recentError) {
      console.error('Error fetching recent videos for quality check:', recentError)
      return alerts
    }

    // Get previous period quality scores
    const { data: previousVideos, error: previousError } = await adminClient
      .from('videos')
      .select('quality_score, created_at')
      .not('quality_score', 'is', null)
      .gte('created_at', fortyEightHoursAgo.toISOString())
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })

    if (previousError) {
      console.error('Error fetching previous videos for quality comparison:', previousError)
      return alerts
    }

    // Calculate average quality scores
    const recentAvg = recentVideos.length > 0
      ? recentVideos.reduce((sum: number, v: any) => sum + (v.quality_score || 0), 0) / recentVideos.length
      : 0

    const previousAvg = previousVideos.length > 0
      ? previousVideos.reduce((sum: number, v: any) => sum + (v.quality_score || 0), 0) / previousVideos.length
      : 0

    // Check for significant quality degradation
    const degradationThreshold = 0.1 // 10% drop
    const qualityDrop = previousAvg - recentAvg

    if (qualityDrop > degradationThreshold && recentVideos.length >= 5) {
      alerts.push({
        id: `quality_degradation_${Date.now()}`,
        type: 'quality_degradation',
        severity: qualityDrop > 0.2 ? 'critical' : qualityDrop > 0.15 ? 'high' : 'medium',
        message: `Quality score dropped ${(qualityDrop * 100).toFixed(1)}% in the last 24 hours`,
        details: {
          recentAverage: recentAvg,
          previousAverage: previousAvg,
          drop: qualityDrop,
          recentVideosCount: recentVideos.length,
          previousVideosCount: previousVideos.length
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    // Check for critical quality failure rate
    const recentFailures = recentVideos.filter((v: any) => (v.quality_score || 0) < 0.5).length
    const failureRate = recentVideos.length > 0 ? recentFailures / recentVideos.length : 0

    if (failureRate > 0.3 && recentVideos.length >= 10) { // 30% failure rate
      alerts.push({
        id: `quality_failure_rate_${Date.now()}`,
        type: 'quality_degradation',
        severity: 'critical',
        message: `Critical quality failure rate: ${(failureRate * 100).toFixed(1)}% of recent videos failed quality validation`,
        details: {
          failureRate,
          failures: recentFailures,
          total: recentVideos.length
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

  } catch (error) {
    console.error('Error checking quality degradation:', error)
  }

  return alerts
}

/**
 * Check for model performance alerts
 */
async function checkModelPerformance(adminClient: any): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = []

  try {
    // Get model performance stats for the last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: modelStats, error } = await adminClient
      .from('videos')
      .select('input_metadata')
      .not('input_metadata', 'is', null)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .eq('status', 'COMPLETED')

    if (error) {
      console.error('Error fetching model stats:', error)
      return alerts
    }

    // Group by model and calculate performance
    const modelPerformance: Record<string, { total: number, failures: number, avgScore: number }> = {}

    modelStats.forEach((video: any) => {
      const metadata = video.input_metadata as any
      const model = metadata?.model || 'unknown'
      const qualityScore = metadata?.quality_score || 0

      if (!modelPerformance[model]) {
        modelPerformance[model] = { total: 0, failures: 0, avgScore: 0 }
      }

      modelPerformance[model].total++
      modelPerformance[model].avgScore += qualityScore

      if (qualityScore < 0.5) {
        modelPerformance[model].failures++
      }
    })

    // Check for underperforming models
    Object.entries(modelPerformance).forEach(([model, stats]) => {
      if (stats.total >= 5) { // Only check models with sufficient data
        const avgScore = stats.avgScore / stats.total
        const failureRate = stats.failures / stats.total

        // Alert on low quality scores
        if (avgScore < 0.7) {
          alerts.push({
            id: `model_quality_${model}_${Date.now()}`,
            type: 'model_performance',
            severity: avgScore < 0.5 ? 'critical' : avgScore < 0.6 ? 'high' : 'medium',
            message: `Model ${model} has low average quality score: ${(avgScore * 100).toFixed(1)}%`,
            details: {
              model,
              averageScore: avgScore,
              totalVideos: stats.total,
              failureRate
            },
            timestamp: new Date().toISOString(),
            acknowledged: false
          })
        }

        // Alert on high failure rates
        if (failureRate > 0.4) {
          alerts.push({
            id: `model_failure_rate_${model}_${Date.now()}`,
            type: 'model_performance',
            severity: 'high',
            message: `Model ${model} has high failure rate: ${(failureRate * 100).toFixed(1)}%`,
            details: {
              model,
              failureRate,
              failures: stats.failures,
              totalVideos: stats.total
            },
            timestamp: new Date().toISOString(),
            acknowledged: false
          })
        }
      }
    })

  } catch (error) {
    console.error('Error checking model performance:', error)
  }

  return alerts
}

/**
 * Check for regeneration failure alerts
 */
async function checkRegenerationFailures(adminClient: any): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = []

  try {
    // Get regeneration stats for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: regenerationStats, error } = await adminClient
      .from('videos')
      .select('input_metadata, status')
      .not('input_metadata', 'is', null)
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) {
      console.error('Error fetching regeneration stats:', error)
      return alerts
    }

    const regenerationAttempts = regenerationStats.filter((v: any) =>
      (v.input_metadata as any)?.is_regeneration
    ).length

    const regenerationFailures = regenerationStats.filter((v: any) =>
      (v.input_metadata as any)?.is_regeneration && v.status === 'FAILED'
    ).length

    if (regenerationAttempts >= 10) { // Only alert if we have sufficient data
      const failureRate = regenerationFailures / regenerationAttempts

      if (failureRate > 0.5) { // 50% regeneration failure rate
        alerts.push({
          id: `regeneration_failure_rate_${Date.now()}`,
          type: 'regeneration_failure',
          severity: 'high',
          message: `High regeneration failure rate: ${(failureRate * 100).toFixed(1)}% of regeneration attempts are failing`,
          details: {
            attempts: regenerationAttempts,
            failures: regenerationFailures,
            failureRate
          },
          timestamp: new Date().toISOString(),
          acknowledged: false
        })
      }
    }

  } catch (error) {
    console.error('Error checking regeneration failures:', error)
  }

  return alerts
}

/**
 * Check for system health alerts
 */
async function checkSystemHealth(adminClient: any): Promise<QualityAlert[]> {
  const alerts: QualityAlert[] = []

  try {
    // Check for videos stuck in processing state
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const { data: stuckVideos, error: stuckError } = await adminClient
      .from('videos')
      .select('id, created_at')
      .eq('status', 'PROCESSING')
      .lt('created_at', oneHourAgo.toISOString())

    if (!stuckError && stuckVideos && stuckVideos.length > 0) {
      alerts.push({
        id: `stuck_videos_${Date.now()}`,
        type: 'system_health',
        severity: stuckVideos.length > 10 ? 'critical' : stuckVideos.length > 5 ? 'high' : 'medium',
        message: `${stuckVideos.length} videos have been stuck in processing state for over 1 hour`,
        details: {
          stuckCount: stuckVideos.length,
          videoIds: stuckVideos.slice(0, 10).map((v: any) => v.id) // First 10 for reference
        },
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    // Check API response times (if we had that data)
    // This would require additional monitoring infrastructure

  } catch (error) {
    console.error('Error checking system health:', error)
  }

  return alerts
}
