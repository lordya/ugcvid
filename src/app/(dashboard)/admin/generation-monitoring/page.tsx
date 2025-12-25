'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Clock, TrendingDown, Activity } from 'lucide-react'

interface CircuitBreakerStatus {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: number
  lastFailureTime: number | null
  timeUntilRetry?: number
}

interface GenerationStats {
  summary: {
    total: number
    completed: number
    failed: number
    processing: number
    successRate: number
    avgGenerationTimeSeconds: number | null
  }
  byFormat: Record<string, { total: number; completed: number; failed: number; successRate: number }>
  byModel: Record<string, { total: number; completed: number; failed: number; successRate: number }>
  failureReasons: Record<string, number>
  refunds: {
    totalRefunds: number
    totalRefundCredits: number
  }
  recentFailures: Array<{
    id: string
    video_id: string
    user_id: string
    format: string
    model: string
    error_reason: string | null
    created_at: string
    completed_at: string | null
  }>
  period: {
    days: number
    startDate: string
    endDate: string
  }
  circuitBreaker: CircuitBreakerStatus
}

export default function GenerationMonitoringPage() {
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [activeTab, setActiveTab] = useState('formats')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/generation-stats?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch generation stats')
      }
      const data: GenerationStats = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground">Loading generation statistics...</div>
      </div>
    )
  }

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
        <div className="text-center text-muted-foreground">No data available</div>
      </div>
    )
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'text-success'
      case 'OPEN':
        return 'text-destructive'
      case 'HALF_OPEN':
        return 'text-warning'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Generation Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor video generation performance, failures, and system health
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <Tabs value={days.toString()} onValueChange={(v) => setDays(parseInt(v, 10))}>
          <TabsList>
            <TabsTrigger value="1">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Circuit Breaker Status */}
      <Card className="bg-layer-2 border-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Circuit Breaker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current State</p>
              <p className={`text-2xl font-bold ${getStatusColor(stats.circuitBreaker.state)}`}>
                {stats.circuitBreaker.state}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failures</p>
              <p className="text-2xl font-bold font-mono">{stats.circuitBreaker.failures}</p>
            </div>
            {stats.circuitBreaker.timeUntilRetry !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Retry In</p>
                <p className="text-2xl font-bold font-mono">{stats.circuitBreaker.timeUntilRetry}s</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Total Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{stats.summary.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-success">
              {stats.summary.successRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.summary.completed} / {stats.summary.total} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-destructive">{stats.summary.failed}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.summary.processing} still processing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-layer-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Generation Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">
              {stats.summary.avgGenerationTimeSeconds
                ? `${Math.round(stats.summary.avgGenerationTimeSeconds / 60)}m`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="formats">By Format</TabsTrigger>
            <TabsTrigger value="models">By Model</TabsTrigger>
            <TabsTrigger value="failures">Failure Reasons</TabsTrigger>
            <TabsTrigger value="recent">Recent Failures</TabsTrigger>
          </TabsList>

        <TabsContent value="formats">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle>Success Rate by Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byFormat).map(([format, data]) => (
                  <div key={format} className="flex items-center justify-between p-3 bg-layer-3 rounded-md">
                    <div>
                      <p className="font-medium">{format}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.completed} completed, {data.failed} failed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${data.successRate >= 80 ? 'text-success' : data.successRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        {data.successRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle>Success Rate by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byModel).map(([model, data]) => (
                  <div key={model} className="flex items-center justify-between p-3 bg-layer-3 rounded-md">
                    <div>
                      <p className="font-medium">{model}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.completed} completed, {data.failed} failed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${data.successRate >= 80 ? 'text-success' : data.successRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        {data.successRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle>Failure Reasons Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.failureReasons)
                  .sort(([, a], [, b]) => b - a)
                  .map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between p-3 bg-layer-3 rounded-md">
                      <p className="text-sm font-medium">{reason}</p>
                      <p className="text-sm font-mono text-destructive">{count}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card className="bg-layer-2 border-border">
            <CardHeader>
              <CardTitle>Recent Failures (Last 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentFailures.map((failure) => (
                  <div key={failure.id} className="p-3 bg-layer-3 rounded-md border-l-4 border-destructive">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Format: {failure.format} | Model: {failure.model}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Video ID: {failure.video_id}
                        </p>
                        {failure.error_reason && (
                          <p className="text-sm text-destructive mt-2">{failure.error_reason}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{new Date(failure.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Refund Statistics */}
      <Card className="bg-layer-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Refund Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold font-mono">{stats.refunds.totalRefunds}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits Refunded</p>
              <p className="text-2xl font-bold font-mono">{stats.refunds.totalRefundCredits}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

