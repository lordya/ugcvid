'use client'

import { useEffect, useState } from 'react'
import { WelcomeModal } from './WelcomeModal'

interface LibraryOnboardingProps {
  videoCount: number
}

export function LibraryOnboarding({ videoCount }: LibraryOnboardingProps) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user has seen welcome and has no videos
    if (videoCount === 0 && typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        setShowWelcome(true)
      }
    }
  }, [videoCount])

  if (!mounted) {
    return null
  }

  return (
    <WelcomeModal 
      isOpen={showWelcome} 
      onClose={() => setShowWelcome(false)} 
    />
  )
}

