import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Initialize Lemon Squeezy SDK
const apiKey = process.env.LEMONSQUEEZY_API_KEY
const storeId = process.env.LEMONSQUEEZY_STORE_ID

if (!apiKey || !storeId) {
  throw new Error('Missing Lemon Squeezy environment variables')
}

lemonSqueezySetup({ apiKey })

const checkoutSchema = z.object({
  variantId: z.string(),
  credits: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { variantId, credits } = checkoutSchema.parse(body)

    // Create checkout session
    const { data, error } = await createCheckout(storeId!, variantId, {
      checkoutOptions: {
        embed: false, // Use redirect checkout
        media: false,
        logo: true,
      },
      checkoutData: {
        custom: {
          user_id: user.id,
          credits: credits.toString(),
        },
        // Pre-fill customer email if available
        email: user.email || undefined,
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
        receiptButtonText: 'Return to Dashboard',
        receiptThankYouNote: 'Thank you for your purchase! Your credits will be added automatically.',
      },
    })

    if (error) {
      console.error('Lemon Squeezy checkout error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 400 })
    }

    return NextResponse.json({
      checkoutUrl: data?.data?.attributes?.url,
    })
  } catch (error) {
    console.error('Checkout creation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

