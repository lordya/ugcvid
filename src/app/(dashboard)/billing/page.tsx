'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'

interface PricingPlan {
  id: string
  name: string
  credits: number
  price: number
  variantId: string // Lemon Squeezy variant ID
  popular?: boolean
}

// Pricing plans - these should match your Lemon Squeezy variants
const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9.99,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_STARTER || '',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50,
    price: 39.99,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PRO || '',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 150,
    price: 99.99,
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ENTERPRISE || '',
  },
]

export default function BillingPage() {
  const [user, setUser] = useState<any>(null)
  const [creditsBalance, setCreditsBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')

  useEffect(() => {
    // Check for success parameter
    if (searchParams.get('success') === 'true') {
      // Refresh user data to show updated credits
      fetchUserData()
    }
  }, [searchParams])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      setUser(authUser)

      // Fetch user credits balance
      const { data: userData, error } = await supabase
        .from('users')
        .select('credits_balance')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
      } else {
        setCreditsBalance(userData?.credits_balance || 0)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLemonSqueezyCheckout = async (plan: PricingPlan) => {
    try {
      setProcessing(plan.id)
      const response = await fetch('/api/payment/lemonsqueezy/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: plan.variantId,
          credits: plan.credits,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Lemon Squeezy checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout')
      setProcessing(null)
    }
  }

  const handleCryptomusCheckout = async (plan: PricingPlan) => {
    try {
      setProcessing(plan.id)
      const response = await fetch('/api/payment/cryptomus/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'USD',
          credits: plan.credits,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      // Redirect to Cryptomus payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout')
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0E14] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0E14] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-2">Buy Credits</h1>
          <p className="text-muted-foreground">
            Current balance: <span className="font-semibold text-foreground">{creditsBalance} credits</span>
          </p>
        </div>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'card' | 'crypto')} className="mb-8">
          <TabsList className="bg-[#161B22] border border-border">
            <TabsTrigger value="card" className="data-[state=active]:bg-[#1F2937]">
              Card / PayPal
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-[#1F2937]">
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={`bg-[#161B22] border-border ${
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
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.credits} credits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">${plan.price}</div>
                    <p className="text-sm text-muted-foreground">
                      ${(plan.price / plan.credits).toFixed(2)} per credit
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleLemonSqueezyCheckout(plan)}
                      disabled={processing === plan.id || !plan.variantId}
                    >
                      {processing === plan.id ? 'Processing...' : 'Pay with Card'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={`bg-[#161B22] border-border ${
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
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.credits} credits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">${plan.price}</div>
                    <p className="text-sm text-muted-foreground">
                      ${(plan.price / plan.credits).toFixed(2)} per credit
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleCryptomusCheckout(plan)}
                      disabled={processing === plan.id}
                    >
                      {processing === plan.id ? 'Processing...' : 'Pay with Crypto'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

