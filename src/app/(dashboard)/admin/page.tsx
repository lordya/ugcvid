'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, Users, Video, CreditCard, DollarSign } from 'lucide-react'
import Link from 'next/link'

import { StatCard } from '@/components/admin/analytics/StatCard'
import { TimeSeriesChart } from '@/components/admin/analytics/TimeSeriesChart'
import { AnalyticsBarChart } from '@/components/admin/analytics/BarChart'
import { AnalyticsPieChart } from '@/components/admin/analytics/PieChart'

interface AnalyticsData {
  data: any[]
  period: {
    startDate: string
    endDate: string
    days: number
  }
  groupedByModel?: Record<string, any[]>
  groupedByFormat?: Record<string, any[]>
}

interface SystemStats {
  totalUsers: number
  totalVideos: number
  creditsConsumed: number
  totalPrompts: number
  activePrompts: number
  promptsByModel: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [analyticsData, setAnalyticsData] = useState<Record<string, AnalyticsData>>({})
  const [analyticsLoading, setAnalyticsLoading] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState('trends')

  // Load system stats
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats')
      if (!response.ok) throw new Error('Failed to load system stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  // Load analytics data
  const loadAnalyticsData = useCallback(async (endpoint: string) => {
    setAnalyticsLoading(prev => ({ ...prev, [endpoint]: true }))
    try {
      const response = await fetch(`/api/admin/analytics/${endpoint}?days=${days}`)
      if (!response.ok) throw new Error(`Failed to load ${endpoint} data`)
      const data = await response.json()
      setAnalyticsData(prev => ({ ...prev, [endpoint]: data }))
    } catch (err) {
      console.error(`Error loading ${endpoint} analytics:`, err)
    } finally {
      setAnalyticsLoading(prev => ({ ...prev, [endpoint]: false }))
    }
  }, [days])

  // Load all analytics data
  const loadAllAnalytics = useCallback(() => {
    const endpoints = [
      'user-growth',
      'video-trends',
      'credit-usage',
      'revenue',
      'model-performance',
      'format-performance',
      'user-activity'
    ]
    endpoints.forEach(endpoint => loadAnalyticsData(endpoint))
  }, [loadAnalyticsData])

  useEffect(() => {
    loadSystemStats()
    loadAllAnalytics()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemStats()
      loadAllAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [days, loadAllAnalytics])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-layer-2 border-border">
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="w-5 h-5 mb-2" />
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
          <Button onClick={loadSystemStats} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const userGrowthData = analyticsData['user-growth']?.data || []
  const videoTrendsData = analyticsData['video-trends']?.data || []
  const creditUsageData = analyticsData['credit-usage']?.data || []
  const revenueData = analyticsData['revenue']?.data || []
  const modelPerformanceData = analyticsData['model-performance']?.groupedByModel || {}
  const userActivityData = analyticsData['user-activity']?.data || []

  // Calculate trends for stat cards
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 7) return 0
    const recent = data.slice(-7).reduce((sum, item) => sum + (item[key] || 0), 0) / 7
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + (item[key] || 0), 0) / 7
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0
  }

  const userGrowthTrend = calculateTrend(userGrowthData, 'new_users')
  const videoTrend = calculateTrend(videoTrendsData, 'total_videos')
  const creditTrend = calculateTrend(creditUsageData, 'credits_consumed')

  // Prepare chart data
  const statusDistributionData = videoTrendsData.length > 0 ? [
    { name: 'Completed', value: videoTrendsData[videoTrendsData.length - 1]?.completed_videos || 0 },
    { name: 'Processing', value: videoTrendsData[videoTrendsData.length - 1]?.processing_videos || 0 },
    { name: 'Failed', value: videoTrendsData[videoTrendsData.length - 1]?.failed_videos || 0 }
  ] : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive system statistics and performance metrics.
            </p>
          </div>
          <Button onClick={loadAllAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6">
        <Tabs value={days.toString()} onValueChange={(v) => setDays(parseInt(v, 10))}>
          <TabsList>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() || '0'}
          change={userGrowthTrend}
          changeLabel="vs previous period"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Videos Generated"
          value={stats?.totalVideos.toLocaleString() || '0'}
          change={videoTrend}
          changeLabel="vs previous period"
          icon={<Video className="w-5 h-5" />}
        />
        <StatCard
          title="Credits Consumed"
          value={stats?.creditsConsumed.toLocaleString() || '0'}
          change={creditTrend}
          changeLabel="vs previous period"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <Link href="/admin/prompts">
          <StatCard
            title="Model Prompts"
            value={stats?.totalPrompts.toLocaleString() || '0'}
            changeLabel={`${stats?.activePrompts || 0} active`}
            icon={<DollarSign className="w-5 h-5" />}
            className="cursor-pointer hover:bg-layer-3 transition-colors"
          />
        </Link>
      </div>

      {/* Charts Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Time Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={userGrowthData}
                  dataKeys={[
                    { key: 'new_users', name: 'New Users', color: '#6366F1' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Video Generation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={videoTrendsData}
                  dataKeys={[
                    { key: 'completed_videos', name: 'Completed', color: '#10B981' },
                    { key: 'processing_videos', name: 'Processing', color: '#F59E0B' },
                    { key: 'failed_videos', name: 'Failed', color: '#EF4444' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={creditUsageData}
                  dataKeys={[
                    { key: 'credits_consumed', name: 'Consumed', color: '#6366F1' },
                    { key: 'credits_purchased', name: 'Purchased', color: '#10B981' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={revenueData}
                  dataKeys={[
                    { key: 'credits_revenue', name: 'Credits Revenue', color: '#6366F1' },
                    { key: 'usd_revenue', name: 'USD Revenue', color: '#10B981' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => `$${value.toLocaleString()}`}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsBarChart
                  data={Object.entries(modelPerformanceData).map(([model, data]: [string, any]) => ({
                    name: model,
                    successRate: data[data.length - 1]?.success_rate_percent || 0,
                    avgTime: data[data.length - 1]?.avg_generation_time_seconds || 0
                  }))}
                  dataKeys={[
                    { key: 'successRate', name: 'Success Rate (%)', color: '#10B981' }
                  ]}
                  height={300}
                  yAxisFormatter={(value) => `${value}%`}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Average Generation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsBarChart
                  data={Object.entries(modelPerformanceData).map(([model, data]: [string, any]) => ({
                    name: model,
                    avgTime: data[data.length - 1]?.avg_generation_time_seconds || 0
                  }))}
                  dataKeys={[
                    { key: 'avgTime', name: 'Time (seconds)', color: '#6366F1' }
                  ]}
                  height={300}
                  yAxisFormatter={(value) => `${value}s`}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Video Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsPieChart
                  data={statusDistributionData}
                  height={300}
                  valueFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Model Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsBarChart
                  data={Object.entries(modelPerformanceData).map(([model, data]: [string, any]) => ({
                    name: model,
                    totalAttempts: data.reduce((sum: number, item: any) => sum + (item.total_attempts || 0), 0)
                  }))}
                  dataKeys={[
                    { key: 'totalAttempts', name: 'Total Attempts', color: '#6366F1' }
                  ]}
                  height={300}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={userActivityData}
                  dataKeys={[
                    { key: 'active_users', name: 'Active Users', color: '#6366F1' },
                    { key: 'users_with_completed_videos', name: 'Users with Videos', color: '#10B981' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="bg-layer-2 border-border">
              <CardHeader>
                <CardTitle>Videos Created vs Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  data={userActivityData}
                  dataKeys={[
                    { key: 'videos_created', name: 'Created', color: '#F59E0B' },
                    { key: 'videos_completed', name: 'Completed', color: '#10B981' }
                  ]}
                  height={250}
                  yAxisFormatter={(value) => value.toLocaleString()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

