import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.99,
    pricePerCredit: 0.99,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 39.99,
    pricePerCredit: 0.80,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 150,
    price: 99.99,
    pricePerCredit: 0.67,
    popular: false,
  },
]

const features = [
  'AI-powered script generation',
  'Amazon product integration',
  'Professional video quality',
  'Fast turnaround (minutes)',
  'HD video download',
  'No watermarks',
  'Credits never expire',
]

export const metadata = {
  title: 'Pricing | AFP UGC',
  description: 'Transparent, credit-based pricing for AI-powered UGC video generation',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay only for what you use. Credits never expire.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-[#161B22] border-border ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.credits} credits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-muted-foreground"> / one-time</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  ${plan.pricePerCredit.toFixed(2)} per credit
                </p>
                <ul className="mt-6 space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-[#6366F1] hover:bg-[#6366F1]/90'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 border-t border-border pt-16">
          <h2 className="text-3xl font-semibold text-white text-center">Frequently Asked Questions</h2>
          <div className="mt-12 max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white">How do credits work?</h3>
              <p className="mt-2 text-muted-foreground">
                Each video generation costs 1 credit. Credits never expire, so you can use them whenever you need.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Can I get a refund?</h3>
              <p className="mt-2 text-muted-foreground">
                Yes, we offer refunds for unused credits within 30 days of purchase. Contact support for assistance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">What payment methods do you accept?</h3>
              <p className="mt-2 text-muted-foreground">
                We accept credit cards, PayPal, and cryptocurrency payments through our secure payment partners.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Do you offer custom pricing for high volume?</h3>
              <p className="mt-2 text-muted-foreground">
                Yes, we offer custom enterprise pricing for high-volume users. Contact us to discuss your needs.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/faq">
              <Button variant="outline">View All FAQs</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

