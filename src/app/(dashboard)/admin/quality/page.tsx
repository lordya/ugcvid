'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

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

export default function QualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchQualityMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/quality/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch quality metrics')
      }
      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQualityMetrics()
  }, [])

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading quality metrics...</p>
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load quality metrics: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchQualityMetrics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor video generation quality metrics and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={fetchQualityMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {metrics && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Model Performance</TabsTrigger>
            <TabsTrigger value="issues">Quality Issues</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(metrics.averageQualityScore * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Out of {metrics.totalVideos} videos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quality Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        Excellent
                      </span>
                      <span>{metrics.qualityDistribution.excellent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-blue-500 mr-1" />
                        Good
                      </span>
                      <span>{metrics.qualityDistribution.good}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                        Poor
                      </span>
                      <span>{metrics.qualityDistribution.poor}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <XCircle className="h-3 w-3 text-red-500 mr-1" />
                        Failed
                      </span>
                      <span>{metrics.qualityDistribution.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tier Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Standard</span>
                        <span>{(metrics.tierComparison.standard.averageScore * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={metrics.tierComparison.standard.averageScore * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.tierComparison.standard.totalVideos} videos
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Premium</span>
                        <span>{(metrics.tierComparison.premium.averageScore * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={metrics.tierComparison.premium.averageScore * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.tierComparison.premium.totalVideos} videos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Auto-Regeneration</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.regenerationStats.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Success rate ({metrics.regenerationStats.totalRegenerations} attempts)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg. improvement: +{(metrics.regenerationStats.averageImprovement * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>
                  Quality scores and failure rates by AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.modelPerformance.map((model) => (
                    <div key={model.model} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{model.model}</h4>
                          <Badge variant={model.averageScore > 0.8 ? 'default' : model.averageScore > 0.6 ? 'secondary' : 'destructive'}>
                            {(model.averageScore * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{model.totalVideos} videos</span>
                          <span>Failure rate: {(model.failureRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={model.averageScore * 100} className="mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Quality Issues</CardTitle>
                <CardDescription>
                  Most frequent quality problems detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.commonIssues.map((issue) => (
                    <div key={issue.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <h4 className="font-medium capitalize">{issue.type.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {issue.count} occurrences ({issue.percentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      <Progress value={issue.percentage} className="w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quality Alerts</CardTitle>
                <CardDescription>
                  System alerts and quality degradation warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentAlerts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent quality alerts
                    </p>
                  ) : (
                    metrics.recentAlerts.map((alert) => (
                      <Alert
                        key={alert.id}
                        variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
