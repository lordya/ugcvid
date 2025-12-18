import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('Missing LEMONSQUEEZY_WEBHOOK_SECRET environment variable')
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verifies Lemon Squeezy webhook signature
 * Lemon Squeezy uses HMAC SHA256 of the raw request body using the webhook secret
 * The signature header may be 'x-signature' or 'X-Signature'
 */
function verifySignature(signature: string | null, body: string): boolean {
  if (!signature) {
    return false
  }

  try {
    const hmac = crypto.createHmac('sha256', webhookSecret!)
    const digest = hmac.update(body).digest('hex')
    // Compare signatures in constant time
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    // Lemon Squeezy may send signature in different header formats
    const signature = request.headers.get('x-signature') || request.headers.get('X-Signature')

    // Verify webhook signature
    if (!verifySignature(signature, rawBody)) {
      console.error('Invalid Lemon Squeezy webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name

    // Handle order_created event
    if (eventName === 'order_created') {
      const orderData = payload.data
      const orderId = orderData.id
      // Custom data may be in attributes.custom or in the order line items
      const customData = orderData.attributes?.custom || orderData.attributes?.first_order_item?.product_options?.custom || {}
      const userId = customData.user_id
      const credits = parseInt(customData.credits || '0', 10)

      if (!userId || !credits || credits <= 0) {
        console.error('Missing user_id or invalid credits in webhook payload')
        return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
      }

      // Check if this order was already processed (prevent duplicate processing)
      const supabase = createAdminClient()
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('provider', 'LEMON' as const)
        .eq('payment_id', orderId.toString())
        .single()

      if (existingTransaction) {
        console.log(`Order ${orderId} already processed, skipping`)
        return NextResponse.json({ message: 'Order already processed' }, { status: 200 })
      }

      // Insert PURCHASE transaction
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: credits,
        type: 'PURCHASE' as const,
        provider: 'LEMON' as const,
        payment_id: orderId.toString(),
      })

      if (transactionError) {
        console.error('Error inserting transaction:', transactionError)
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
      }

      console.log(`Successfully processed Lemon Squeezy order ${orderId} for user ${userId}, added ${credits} credits`)
      return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 })
    }

    // Ignore other event types
    console.log(`Ignoring Lemon Squeezy event: ${eventName}`)
    return NextResponse.json({ message: 'Event ignored' }, { status: 200 })
  } catch (error) {
    console.error('Lemon Squeezy webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

