'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Clapperboard } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8">
      {/* Illustration */}
      <div className="mb-8 relative">
        <Clapperboard 
          className="w-32 h-32 text-[#6366F1] opacity-20" 
          strokeWidth={1.5}
        />
      </div>

      {/* Headline */}
      <h2 className="text-2xl font-semibold text-white mb-3">
        Your library is empty.
      </h2>

      {/* Subhead */}
      <p className="text-muted-foreground text-lg mb-8 max-w-md text-center">
        Create your first viral video in minutes.
      </p>

      {/* Primary CTA */}
      <Link href="/wizard">
        <Button 
          size="lg" 
          className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white h-12 px-8 text-base font-semibold"
        >
          Create Video
        </Button>
      </Link>
    </div>
  )
}

