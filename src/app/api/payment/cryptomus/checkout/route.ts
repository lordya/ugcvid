import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

const merchantId = process.env.CRYPTOMUS_MERCHANT_ID
const apiKey = process.env.CRYPTOMUS_API_KEY

if (!merchantId || !apiKey) {
  throw new Error('Missing Cryptomus environment variables')
}

const checkoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  credits: z.number().int().positive(),
})

/**
 * Generates Cryptomus payment signature
 * Signature = MD5(base64(json_body) + api_key)
 */
function generateSignature(payload: object, apiKey: string): string {
  const jsonString = JSON.stringify(payload)
  const base64Payload = Buffer.from(jsonString).toString('base64')
  const signatureString = base64Payload + apiKey
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

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
    const { amount, currency, credits } = checkoutSchema.parse(body)

    // Generate internal order ID
    const orderId = uuidv4()

    // Prepare payment payload
    const paymentPayload = {
      amount: amount.toString(),
      currency: currency,
      order_id: orderId,
      url_return: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      url_callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/cryptomus`,
      is_payment_multiple: false,
      lifetime: 7200, // 2 hours
      additional_data: {
        user_id: user.id,
        credits: credits.toString(),
      },
    }

    // Generate signature
    const signature = generateSignature(paymentPayload, apiKey)

    // Create payment via Cryptomus API
    const response = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: merchantId,
        sign: signature,
      },
      body: JSON.stringify(paymentPayload),
    })

    const data = await response.json()

    if (!response.ok || data.result?.state !== 0) {
      console.error('Cryptomus payment creation error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to create payment' },
        { status: response.status || 400 }
      )
    }

    return NextResponse.json({
      paymentUrl: data.result?.payment_url,
      orderId: orderId,
      paymentId: data.result?.uuid,
    })
  } catch (error) {
    console.error('Cryptomus checkout error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

