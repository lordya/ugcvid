import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, Eye, Heart } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: 'Mission',
    description:
      'To democratize professional video creation by making AI-powered tools accessible to everyone, regardless of technical expertise.',
  },
  {
    icon: Eye,
    title: 'Vision',
    description:
      'We envision a world where creating high-quality marketing content is as simple as pasting a URL, enabling businesses of all sizes to compete effectively.',
  },
  {
    icon: Heart,
    title: 'Values',
    description:
      'Transparency, quality, and user empowerment guide everything we do. We believe in honest pricing, exceptional results, and putting control in your hands.',
  },
]

export const metadata = {
  title: 'About Us | AFP UGC',
  description: 'Learn about our mission to democratize professional video creation',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">About AFP UGC</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Empowering creators with AI-powered video generation
          </p>
        </div>

        {/* Story Section */}
        <div className="mt-16 space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            AFP UGC was born from a simple observation: creating professional product videos was too
            complex, time-consuming, and expensive for most businesses. We set out to change that.
          </p>
          <p className="text-lg leading-relaxed">
            Our platform combines cutting-edge AI technology with an intuitive interface, making it
            possible for anyone to create high-quality UGC videos in minutes. Whether you&apos;re a
            dropshipper, marketer, or business owner, our tools are designed to help you succeed.
          </p>
          <p className="text-lg leading-relaxed">
            We believe in transparency, quality, and putting control back in your hands. That&apos;s why
            we offer credit-based pricing with no hidden fees, a review step so you can approve
            scripts before generation, and professional-quality output you can trust.
          </p>
        </div>

        {/* Values Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon
            return (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#161B22] border border-border">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{value.title}</h3>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 border-t border-border pt-16 text-center">
          <h2 className="text-3xl font-semibold text-white">Join Us on This Journey</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start creating professional videos today
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-[#6366F1] hover:bg-[#6366F1]/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

