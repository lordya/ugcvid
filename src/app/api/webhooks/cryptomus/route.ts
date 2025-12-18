import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const apiKey = process.env.CRYPTOMUS_API_KEY

if (!apiKey) {
  throw new Error('Missing CRYPTOMUS_API_KEY environment variable')
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verifies Cryptomus webhook signature
 * Signature = MD5(base64(json_body) + api_key)
 */
function verifySignature(signature: string | null, body: string): boolean {
  if (!signature) {
    return false
  }

  const base64Payload = Buffer.from(body).toString('base64')
  const signatureString = base64Payload + apiKey
  const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('sign')

    // Verify webhook signature
    if (!verifySignature(signature, rawBody)) {
      console.error('Invalid Cryptomus webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const paymentData = payload.payment || payload

    // Check payment status
    const status = paymentData.payment_status || paymentData.status
    const paymentId = paymentData.uuid || paymentData.payment_id
    const orderId = paymentData.order_id
    const additionalData = paymentData.additional_data || {}
    const userId = additionalData.user_id
    const credits = parseInt(additionalData.credits || '0', 10)

    // Handle paid status
    if (status === 'paid' || status === 'paid_over') {
      if (!userId || !credits || credits <= 0) {
        console.error('Missing user_id or invalid credits in webhook payload')
        return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
      }

      // Check if this payment was already processed (prevent duplicate processing)
      const supabase = createAdminClient()
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('provider', 'CRYPTO')
        .eq('payment_id', paymentId)
        .single()

      if (existingTransaction) {
        console.log(`Payment ${paymentId} already processed, skipping`)
        return NextResponse.json({ message: 'Payment already processed' }, { status: 200 })
      }

      // Insert PURCHASE transaction
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: credits,
        type: 'PURCHASE',
        provider: 'CRYPTO',
        payment_id: paymentId,
      })

      if (transactionError) {
        console.error('Error inserting transaction:', transactionError)
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
      }

      console.log(`Successfully processed Cryptomus payment ${paymentId} for user ${userId}, added ${credits} credits`)
      return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 })
    }

    // Log other statuses but don't process
    console.log(`Cryptomus payment ${paymentId} status: ${status} (not processing)`)
    return NextResponse.json({ message: 'Status not processed' }, { status: 200 })
  } catch (error) {
    console.error('Cryptomus webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

