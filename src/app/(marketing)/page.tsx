import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Shield, Download } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to library
  if (user) {
    redirect('/library')
  }

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Script Generation',
      description: 'Advanced AI generates engaging scripts automatically from product information',
    },
    {
      icon: Zap,
      title: 'Fast Turnaround',
      description: 'Create professional videos in minutes, not hours',
    },
    {
      icon: Shield,
      title: 'Professional Quality',
      description: 'High-quality videos ready for social media and marketing campaigns',
    },
    {
      icon: Download,
      title: 'Easy Download & Sharing',
      description: 'Download your videos instantly and share across all platforms',
    },
  ]

  const steps = [
    {
      number: '1',
      title: 'Input Product URL',
      description: 'Paste your Amazon product URL or enter details manually',
    },
    {
      number: '2',
      title: 'Review & Edit Script',
      description: 'Review the AI-generated script and make any adjustments',
    },
    {
      number: '3',
      title: 'Generate Video',
      description: 'Watch as our AI creates your professional video automatically',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-semibold text-white leading-tight sm:text-6xl">
            Turn Amazon Products into{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Viral Videos
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground leading-relaxed">
            AI-powered UGC video generation platform. Create professional product videos in minutes, not hours.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white px-8 py-6 text-lg h-auto"
              >
                Start Creating
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg h-auto border-border hover:bg-[#161B22]"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Everything you need to create amazing videos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for efficiency and quality
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#161B22] border border-border">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-[#161B22] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Create professional videos in three simple steps
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Ready to create your first video?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of creators using AI to generate professional product videos
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white px-8 py-6 text-lg h-auto"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

