import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to library
  if (user) {
    redirect('/library')
  }

  return (
    <main className="min-h-screen bg-[#0A0E14] flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight">
            Turn Amazon Products into{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Viral Videos
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered UGC video generation platform. Create professional product videos in minutes, not hours.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <Button 
              size="lg" 
              className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white px-8 py-6 text-lg h-auto"
            >
              Start Creating
            </Button>
          </Link>
          <Link href="/login">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg h-auto border-border hover:bg-[#161B22]"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI generates scripts and creates videos automatically
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Fast & Easy</h3>
            <p className="text-sm text-muted-foreground">
              Create professional videos in minutes with just a product URL
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Professional Quality</h3>
            <p className="text-sm text-muted-foreground">
              High-quality videos ready for social media and marketing
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

