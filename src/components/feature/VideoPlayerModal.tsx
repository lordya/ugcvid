'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface VideoPlayerModalProps {
  videoUrl: string
  script: string
  onClose: () => void
}

export function VideoPlayerModal({ videoUrl, script, onClose }: VideoPlayerModalProps) {
  const handleDownload = () => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
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
                  className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MP4
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MP4
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

