'use client'

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VideoPlayerModalProps {
  videoUrl: string
  videoId: string
  script: string
  onClose: () => void
}

export function VideoPlayerModal({ videoUrl, videoId, script, onClose }: VideoPlayerModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDownload = async () => {
    if (!videoUrl) return

    setIsDownloading(true)
    const filename = `afp-ugc-${videoId}.mp4`

    try {
      // Approach 1: Try direct download with blob fetch
      const response = await fetch(videoUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch video')
      }

      // Check if CORS allows blob response
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl)

      showToast('Download started!', 'success')
    } catch (error) {
      console.error('Direct download failed, trying proxy:', error)
      
      // Approach 2: Fallback to proxy route if direct download fails
      try {
        const proxyResponse = await fetch(`/api/download/${videoId}`)
        
        if (!proxyResponse.ok) {
          throw new Error('Proxy download failed')
        }

        const blob = await proxyResponse.blob()
        const blobUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(blobUrl)

        showToast('Download started!', 'success')
      } catch (proxyError) {
        console.error('Proxy download failed:', proxyError)
        showToast('Download failed. Please try again.', 'error')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl bg-[#161B22] border-border p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Video Player - Centered on black backdrop */}
            <div className="flex-1 flex items-center justify-center bg-black p-6 lg:p-8">
              <div className="w-full max-w-md">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full rounded-lg"
                  style={{ aspectRatio: '9/16' }}
                />
              </div>
            </div>

            {/* Sidebar/Bottom Bar: Script and Download */}
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-[#161B22] p-6 flex flex-col">
              {script ? (
                <>
                  <div className="flex-1 overflow-y-auto mb-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Script</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {script}
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download MP4
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download MP4
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-[100] p-4 rounded-md shadow-lg border transition-all animate-in slide-in-from-top-5',
            toast.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
          )}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
    </>
  )
}

