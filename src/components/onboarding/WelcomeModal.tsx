'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStartCreating = () => {
    // Set localStorage to remember user has seen the welcome
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true')
    }
    onClose()
    router.push('/wizard')
  }

  const handleDismiss = () => {
    // Set localStorage to remember user has dismissed
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true')
    }
    onClose()
  }

  if (!mounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="bg-[#161B22] border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Welcome to AFP UGC! 🚀
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base pt-2">
            Ready to turn Amazon products into videos? Let&apos;s get started.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
          >
            Dismiss
          </Button>
          <Button
            onClick={handleStartCreating}
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white w-full sm:w-auto"
          >
            Start Creating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

