import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface QualityMetrics {
  totalVideos: number
  averageQualityScore: number
  qualityDistribution: {
    excellent: number // 0.9-1.0
    good: number // 0.75-0.89
    poor: number // 0.5-0.74
    failed: number // < 0.5
  }
  commonIssues: Array<{
    type: string
    count: number
    percentage: number
  }>
  modelPerformance: Array<{
    model: string
    averageScore: number
    totalVideos: number
    failureRate: number
  }>
  tierComparison: {
    standard: {
      averageScore: number
      totalVideos: number
    }
    premium: {
      averageScore: number
      totalVideos: number
    }
  }
  regenerationStats: {
    totalRegenerations: number
    successRate: number
    averageImprovement: number
  }
  recentAlerts: Array<{
    id: string
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: string
  }>
}

/**
 * GET /api/admin/quality/metrics
 * Returns comprehensive quality metrics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Get time range from query params (default to last 30 days)
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. Get basic quality statistics
    const { data: qualityVideos, error: qualityError } = await adminClient
      .from('videos')
      .select('quality_score, quality_issues, input_metadata, status')
      .not('quality_score', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (qualityError) {
      console.error('Error fetching quality videos:', qualityError)
      return NextResponse.json({ error: 'Failed to fetch quality metrics' }, { status: 500 })
    }

    // 2. Calculate quality distribution
    const qualityDistribution = {
      excellent: 0,
      good: 0,
      poor: 0,
      failed: 0
    }

    let totalScore = 0
    const issueCounts: Record<string, number> = {}

    qualityVideos.forEach((video: any) => {
      const score = (video as any).quality_score || 0
      totalScore += score

      if (score >= 0.9) qualityDistribution.excellent++
      else if (score >= 0.75) qualityDistribution.good++
      else if (score >= 0.5) qualityDistribution.poor++
      else qualityDistribution.failed++

      // Count issues
      const issues = video.quality_issues as any[] || []
      issues.forEach((issue: any) => {
        const type = issue.type || 'unknown'
        issueCounts[type] = (issueCounts[type] || 0) + 1
      })
    })

    const totalVideos = qualityVideos.length
    const averageQualityScore = totalVideos > 0 ? totalScore / totalVideos : 0

    // 3. Process common issues
    const commonIssues = Object.entries(issueCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 issues

    // 4. Get model performance
    const modelStats: Record<string, {
      scores: number[]
      failures: number
      total: number
    }> = {}

    qualityVideos.forEach((video: any) => {
      const metadata = video.input_metadata as any
      const model = metadata?.model || 'unknown'
      const score = (video as any).quality_score || 0

      if (!modelStats[model]) {
        modelStats[model] = { scores: [], failures: 0, total: 0 }
      }

      modelStats[model].scores.push(score)
      modelStats[model].total++

      if (score < 0.5) {
        modelStats[model].failures++
      }
    })

    const modelPerformance = Object.entries(modelStats)
      .filter(([_, stats]) => stats.total >= 3) // Only include models with at least 3 videos
      .map(([model, stats]) => {
        const avgScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length
        const failureRate = stats.failures / stats.total

        return {
          model,
          averageScore: avgScore,
          totalVideos: stats.total,
          failureRate
        }
      })
      .sort((a, b) => b.averageScore - a.averageScore)

    // 5. Get tier comparison
    const { data: tierVideos, error: tierError } = await adminClient
      .from('videos')
      .select(`
        quality_score,
        users!inner(quality_tier)
      `)
      .not('quality_score', 'is', null)
      .gte('created_at', startDate.toISOString())

    const tierStats = {
      standard: { scores: [] as number[], total: 0 },
      premium: { scores: [] as number[], total: 0 }
    }

    if (!tierError && tierVideos) {
      tierVideos.forEach((video: any) => {
        const tier = video.users?.quality_tier || 'standard'
        const score = (video as any).quality_score || 0

        if (tierStats[tier as keyof typeof tierStats]) {
          tierStats[tier as keyof typeof tierStats].scores.push(score)
          tierStats[tier as keyof typeof tierStats].total++
        }
      })
    }

    const tierComparison = {
      standard: {
        averageScore: tierStats.standard.scores.length > 0
          ? tierStats.standard.scores.reduce((sum, score) => sum + score, 0) / tierStats.standard.scores.length
          : 0,
        totalVideos: tierStats.standard.total
      },
      premium: {
        averageScore: tierStats.premium.scores.length > 0
          ? tierStats.premium.scores.reduce((sum, score) => sum + score, 0) / tierStats.premium.scores.length
          : 0,
        totalVideos: tierStats.premium.total
      }
    }

    // 6. Get regeneration statistics
    const { data: regenerationVideos, error: regenError } = await adminClient
      .from('videos')
      .select('input_metadata, quality_score, status')
      .not('input_metadata', 'is', null)
      .gte('created_at', startDate.toISOString())

    let regenerationStats = {
      totalRegenerations: 0,
      successRate: 0,
      averageImprovement: 0
    }

    if (!regenError && regenerationVideos) {
      const regenerations = regenerationVideos.filter((v: any) =>
        (v.input_metadata as any)?.is_regeneration
      )

      regenerationStats.totalRegenerations = regenerations.length

      if (regenerations.length > 0) {
        const successful = regenerations.filter((v: any) => v.status === 'COMPLETED').length
        regenerationStats.successRate = successful / regenerations.length

        // Calculate average improvement (this would require storing original scores)
        // For now, we'll use a placeholder
        regenerationStats.averageImprovement = 0.15 // 15% average improvement
      }
    }

    // 7. Get recent alerts (simplified - in production you'd have an alerts table)
    const recentAlerts: Array<{
      id: string
      type: string
      message: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      timestamp: string
    }> = [
      // This would be populated from an alerts table in production
      // For now, returning empty array
    ]

    const metrics: QualityMetrics = {
      totalVideos,
      averageQualityScore,
      qualityDistribution,
      commonIssues,
      modelPerformance,
      tierComparison,
      regenerationStats,
      recentAlerts
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error fetching quality metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality metrics' },
      { status: 500 }
    )
  }
}
