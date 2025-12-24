'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/store/useWizardStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { BulkCSVRow } from '@/store/useWizardStore'

interface BulkJob {
  id: string
  rowIndex: number
  url: string
  custom_title?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoId?: string
  error?: string
}

export default function BulkProcessPage() {
  const router = useRouter()
  const {
    bulkCorrectedRows,
    bulkProcessingStatus,
    setBulkProcessingStatus
  } = useWizardStore()

  const [jobs, setJobs] = useState<BulkJob[]>([])
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [completedJobs, setCompletedJobs] = useState(0)
  const [failedJobs, setFailedJobs] = useState(0)

  const startBulkProcessing = useCallback(async (initialJobs: BulkJob[]) => {
    for (let i = 0; i < initialJobs.length; i++) {
      setCurrentJobIndex(i)

      const job = initialJobs[i]
      try {
        // Update job status to processing
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, status: 'processing' } : j
        ))

        // Call bulk generation API
        const response = await fetch('/api/bulk/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: job.url,
            custom_title: job.custom_title,
            style: 'ugc_auth', // Default style, could be made configurable
            duration: '30s' // Default duration
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()

        // Update job as completed
        setJobs(prev => prev.map(j =>
          j.id === job.id
            ? { ...j, status: 'completed', videoId: result.videoId }
            : j
        ))
        setCompletedJobs(prev => prev + 1)

      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error)

        // Update job as failed
        setJobs(prev => prev.map(j =>
          j.id === job.id
            ? { ...j, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
            : j
        ))
        setFailedJobs(prev => prev + 1)
      }

      // Small delay between jobs to avoid overwhelming the API
      if (i < initialJobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Mark bulk processing as completed
    setBulkProcessingStatus('completed')
  }, [setJobs, setCurrentJobIndex, setCompletedJobs, setFailedJobs, setBulkProcessingStatus])

  useEffect(() => {
    if (bulkCorrectedRows.length === 0) {
      router.push('/wizard')
      return
    }

    // Initialize jobs from corrected rows
    const initialJobs: BulkJob[] = bulkCorrectedRows.map((row, index) => ({
      id: `job-${index + 1}`,
      rowIndex: row.rowIndex,
      url: row.url,
      custom_title: row.custom_title,
      status: 'pending'
    }))

    setJobs(initialJobs)
    setBulkProcessingStatus('processing')
    startBulkProcessing(initialJobs)
  }, [bulkCorrectedRows, router, setBulkProcessingStatus, startBulkProcessing])

  const progress = jobs.length > 0 ? ((completedJobs + failedJobs) / jobs.length) * 100 : 0

  const handleGoToLibrary = () => {
    router.push('/library')
  }

  const getStatusIcon = (status: BulkJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }

  const getStatusBadgeVariant = (status: BulkJob['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'processing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">Bulk Video Generation</h1>
        <p className="text-muted-foreground">
          Processing {jobs.length} video{jobs.length > 1 ? 's' : ''} from your CSV upload
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-layer-2 border-border">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Processing Progress</h2>
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="bg-success/10 text-success">
                  {completedJobs} Completed
                </Badge>
                <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                  {failedJobs} Failed
                </Badge>
                <Badge variant="outline">
                  {jobs.length - completedJobs - failedJobs} Remaining
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {bulkProcessingStatus === 'completed' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-success">Bulk Generation Complete!</h3>
                  <p className="text-muted-foreground">
                    {completedJobs} video{completedJobs > 1 ? 's' : ''} successfully created
                    {failedJobs > 0 && `, ${failedJobs} failed`}
                  </p>
                </div>
                <Button onClick={handleGoToLibrary} size="lg">
                  View Videos in Library
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <Card className="bg-layer-2 border-border">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Processing Details</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {jobs.map((job, index) => (
              <div
                key={job.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  job.status === 'processing'
                    ? 'bg-primary/5 border-primary/20'
                    : job.status === 'completed'
                      ? 'bg-success/5 border-success/20'
                      : job.status === 'failed'
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-layer-3 border-border'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Row {job.rowIndex}</span>
                      <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {job.url}
                    </p>
                    {job.custom_title && (
                      <p className="text-sm text-primary truncate max-w-md">
                        {job.custom_title}
                      </p>
                    )}
                    {job.error && (
                      <p className="text-sm text-destructive mt-1">
                        {job.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {job.status === 'processing' && index === currentJobIndex && (
                    <div className="flex items-center space-x-2 text-sm text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                  {job.videoId && (
                    <p className="text-xs text-muted-foreground">
                      Video ID: {job.videoId}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
