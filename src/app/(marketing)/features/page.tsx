import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Shield, Download, Link2, Wand2 } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Script Generation',
    description:
      'Our advanced AI analyzes product information and automatically generates engaging, conversion-focused scripts tailored to your product.',
  },
  {
    icon: Link2,
    title: 'Amazon Product Integration',
    description:
      'Simply paste an Amazon product URL and our system automatically extracts product details, images, and descriptions.',
  },
  {
    icon: Wand2,
    title: 'Professional Video Quality',
    description:
      'Generate high-quality videos optimized for social media platforms with professional-grade visuals and audio.',
  },
  {
    icon: Zap,
    title: 'Fast Turnaround',
    description:
      'Create professional videos in minutes, not hours. No waiting, no delays - just fast, efficient video generation.',
  },
  {
    icon: Shield,
    title: 'Credit-Based Pricing',
    description:
      'Transparent, pay-as-you-go pricing. One credit per video. No subscriptions, no hidden fees. Credits never expire.',
  },
  {
    icon: Download,
    title: 'Easy Download & Sharing',
    description:
      'Download your videos instantly in HD quality. Share directly to social media or save for your marketing campaigns.',
  },
]

export const metadata = {
  title: 'Features | AFP UGC',
  description: 'Discover the powerful features that make AI-powered video generation simple and efficient',
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Powerful Features</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to create professional product videos with AI
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-[#161B22] p-6 transition-colors hover:bg-[#1F2937]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 border-t border-border pt-16 text-center">
          <h2 className="text-3xl font-semibold text-white">Ready to get started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start creating professional videos in minutes
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-[#6366F1] hover:bg-[#6366F1]/90">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

