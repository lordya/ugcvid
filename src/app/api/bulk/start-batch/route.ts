import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getFormatKey, selectModelForFormat, calculateVideoCost, usdToCredits } from '@/lib/kie-models'
import { createVideoTask } from '@/lib/kie'
import { Json } from '@/types/supabase'
import axios from 'axios'
import { validateStyleDuration } from '@/lib/validation'

interface BatchItem {
  url: string
  custom_title?: string
  style?: string
  row_index: number
}

interface StartBatchRequest {
  items: BatchItem[]
  default_style?: string
  default_duration?: '10s' | '15s'
}

interface StartBatchResponse {
  batchId: string
  totalItems: number
  totalCreditsNeeded: number
  userCreditsRemaining: number
  status: 'processing'
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body: StartBatchRequest = await request.json()
    const { items, default_style = 'ugc_auth', default_duration = '15s' } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required and cannot be empty' }, { status: 400 })
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 items per batch' }, { status: 400 })
    }

    // 2.1. Validate default_style and default_duration combination
    const validation = validateStyleDuration(default_style, default_duration)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid default style or duration combination' },
        { status: 400 }
      )
    }

    // 3. Validate all items have valid URLs
    const invalidItems: number[] = []
    items.forEach((item, index) => {
      if (!item.url || !item.url.trim()) {
        invalidItems.push(index + 1)
        return
      }

      const amazonPattern = /^https?:\/\/(www\.)?(amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)|amzn\.to)/
      if (!amazonPattern.test(item.url.trim())) {
        invalidItems.push(index + 1)
      }
    })

    if (invalidItems.length > 0) {
      return NextResponse.json({
        error: `Invalid URLs found at rows: ${invalidItems.join(', ')}`
      }, { status: 400 })
    }

    // 4. Calculate total credits needed for the batch
    let totalCreditsNeeded = 0
    const itemDetails = []

    for (const item of items) {
      const style = item.style || default_style
      const format = getFormatKey(style, default_duration)
      const selectedModel = selectModelForFormat(format)
      const costUsd = calculateVideoCost(selectedModel, default_duration === '10s' ? 10 : 15)
      const costCredits = usdToCredits(costUsd)

      totalCreditsNeeded += costCredits
      itemDetails.push({
        url: item.url,
        custom_title: item.custom_title || null,
        style: style,
        format,
        model: selectedModel.id,
        costCredits,
        row_index: item.row_index
      })
    }

    console.log(`[Batch Start] User: ${user.id}, Items: ${items.length}, Total Credits Needed: ${totalCreditsNeeded}`)

    // 5. Use admin client for atomic transaction
    const adminClient = createAdminClient()

    // 6. Check user's current credit balance
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (userData.credits_balance < totalCreditsNeeded) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${totalCreditsNeeded}, have ${userData.credits_balance}`
      }, { status: 402 })
    }

    // 7. Start transaction: Create batch record and reserve credits
    const { data: batchRecord, error: batchError } = await adminClient
      .from('video_batches')
      .insert({
        user_id: user.id,
        status: 'PROCESSING',
        total_items: items.length,
        total_credits_reserved: totalCreditsNeeded,
        metadata: {
          default_style,
          default_duration,
          source: 'bulk_upload'
        } as Json
      })
      .select()
      .single()

    if (batchError || !batchRecord) {
      console.error('Error creating batch record:', batchError)
      return NextResponse.json({ error: 'Failed to create batch record' }, { status: 500 })
    }

    // 8. Create batch video items
    const batchItemsData = itemDetails.map(item => ({
      batch_id: batchRecord.id,
      row_index: item.row_index,
      url: item.url,
      custom_title: item.custom_title,
      style: item.style,
      metadata: {
        model: item.model,
        format: item.format,
        costCredits: item.costCredits
      } as Json
    }))

    const { error: itemsError } = await adminClient
      .from('batch_video_items')
      .insert(batchItemsData)

    if (itemsError) {
      console.error('Error creating batch items:', itemsError)
      // Rollback: delete batch record
      await adminClient.from('video_batches').delete().eq('id', batchRecord.id)
      return NextResponse.json({ error: 'Failed to create batch items' }, { status: 500 })
    }

    // 9. Reserve credits (this is a temporary hold, actual deduction happens per video)
    // For now, we'll track reserved credits in the batch record
    // In a more sophisticated system, we might want to deduct upfront or use credit holds

    console.log(`[Batch Created] ID: ${batchRecord.id}, Items: ${items.length}, Credits Reserved: ${totalCreditsNeeded}`)

    // 10. Start async batch processing
    // Note: In a production system with Inngest or similar, we'd trigger a workflow here
    // For now, we'll simulate by calling a batch processor function
    try {
      // Fire and forget - start the batch processing
      processBatchAsync(batchRecord.id, user.id)
    } catch (processError) {
      console.error('Error starting batch processing:', processError)
      // Don't fail the request if async processing fails to start
    }

    // 11. Return success response
    return NextResponse.json({
      batchId: batchRecord.id,
      totalItems: items.length,
      totalCreditsNeeded,
      userCreditsRemaining: userData.credits_balance - totalCreditsNeeded,
      status: 'processing'
    } as StartBatchResponse)

  } catch (error) {
    console.error('Batch start API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Rate limiting configuration
const RATE_LIMITS = {
  scraperApi: { requestsPerMinute: 30, delayMs: 2000 }, // Conservative limit
  openai: { requestsPerMinute: 50, delayMs: 1200 },     // Conservative limit
  kie: { requestsPerMinute: 20, delayMs: 3000 }         // Very conservative for video generation
}

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimiters = new Map<string, { lastRequest: number, requestCount: number }>()

function checkRateLimit(api: keyof typeof RATE_LIMITS): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now()
    const key = api
    const limiter = rateLimiters.get(key) || { lastRequest: 0, requestCount: 0 }
    const config = RATE_LIMITS[api]

    // Reset counter if minute has passed
    if (now - limiter.lastRequest > 60000) {
      limiter.requestCount = 0
      limiter.lastRequest = now
    }

    // Check if we're within rate limits
    if (limiter.requestCount >= config.requestsPerMinute) {
      const waitTime = 60000 - (now - limiter.lastRequest)
      console.log(`[Rate Limit] ${api} - Waiting ${waitTime}ms`)
      setTimeout(() => {
        limiter.requestCount = 1
        limiter.lastRequest = Date.now()
        rateLimiters.set(key, limiter)
        resolve()
      }, waitTime)
      return
    }

    // Within limits, add minimum delay
    limiter.requestCount++
    limiter.lastRequest = now
    rateLimiters.set(key, limiter)

    setTimeout(resolve, config.delayMs)
  })
}

// Async function to process the batch (would typically be handled by a queue system like Inngest)
async function processBatchAsync(batchId: string, userId: string) {
  try {
    console.log(`[Batch Processing Started] Batch: ${batchId}, User: ${userId}`)

    const adminClient = createAdminClient()

    // Get batch record to extract default_duration
    const { data: batchRecord, error: batchError } = await adminClient
      .from('video_batches')
      .select('metadata')
      .eq('id', batchId)
      .single()

    if (batchError || !batchRecord) {
      console.error('Error fetching batch record:', batchError)
      return
    }

    const batchMetadata = batchRecord.metadata as any
    const default_duration = (batchMetadata?.default_duration || '15s') as '10s' | '15s'

    // Get all pending items for this batch
    const { data: items, error: itemsError } = await adminClient
      .from('batch_video_items')
      .select('*')
      .eq('batch_id', batchId)
      .eq('status', 'PENDING')
      .order('row_index')

    if (itemsError || !items) {
      console.error('Error fetching batch items:', itemsError)
      return
    }

    // Process items with concurrency limit of 5
    const concurrencyLimit = 5

    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const batchSlice = items.slice(i, i + concurrencyLimit)

      // Process this batch of items concurrently, but with rate limiting
      const batchPromises = batchSlice.map(async (item, index) => {
        try {
          // Add staggered delay to avoid thundering herd
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * 500))
          }

          await processBatchItem(item, userId, default_duration)
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error)
        }
      })

      // Wait for this batch to complete before starting the next
      await Promise.all(batchPromises)

      // Rate limiting delay between batches
      if (i + concurrencyLimit < items.length) {
        console.log(`[Batch Processing] Completed batch ${Math.floor(i/concurrencyLimit) + 1}, waiting before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay between batches
      }
    }

    console.log(`[Batch Processing Completed] Batch: ${batchId}`)

  } catch (error) {
    console.error(`Batch processing failed for batch ${batchId}:`, error)

    // Update batch status to failed
    const adminClient = createAdminClient()
    await adminClient
      .from('video_batches')
      .update({
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
  }
}

// Process a single batch item
async function processBatchItem(item: any, userId: string, default_duration: '10s' | '15s' = '15s') {
  const adminClient = createAdminClient()

  try {
    // Update item status to processing
    await adminClient
      .from('batch_video_items')
      .update({
        status: 'PROCESSING',
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)

    // Extract metadata
    const metadata = item.metadata || {}
    const costCredits = metadata.costCredits || 1

    // Check if user still has credits (in case of concurrent processing)
    const { data: userData } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single()

    if (!userData || userData.credits_balance < costCredits) {
      throw new Error('Insufficient credits for this item')
    }

    // Scrape product data with rate limiting
    let productData
    try {
      await checkRateLimit('scraperApi')

      const scraperApiKey = process.env.SCRAPERAPI_KEY
      if (!scraperApiKey) {
        throw new Error('ScraperAPI key not configured')
      }

      const scraperApiUrl = 'https://api.scraperapi.com/'
      const params = new URLSearchParams({
        api_key: scraperApiKey,
        url: item.url,
        autoparse: 'true',
      })

      const response = await axios.get(scraperApiUrl, {
        params: params,
        timeout: 30000,
      })

      if (!response.data) {
        throw new Error('Failed to fetch product data')
      }

      const data = response.data
      productData = {
        title: item.custom_title || data.name || '',
        description: data.full_description || data.description || '',
        images: Array.isArray(data.images) ? data.images : [],
        pricing: data.pricing,
        rating: data.average_rating,
        reviews_summary: data.customers_say?.summary,
      }

      if (!productData.title || !productData.description) {
        throw new Error('Product data missing required fields')
      }
    } catch (scrapeError) {
      throw new Error(`Scraping failed: ${scrapeError instanceof Error ? scrapeError.message : 'Unknown error'}`)
    }

    // Generate script with rate limiting
    let scriptContent
    try {
      await checkRateLimit('openai')

      const scriptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate/script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productTitle: productData.title,
          productDescription: productData.description,
          style: item.style || 'ugc_auth',
          duration: default_duration,
        }),
      })

      if (!scriptResponse.ok) {
        throw new Error(`Script generation failed: ${scriptResponse.status}`)
      }

      scriptContent = await scriptResponse.json()
    } catch (scriptError) {
      throw new Error(`Script generation failed: ${scriptError instanceof Error ? scriptError.message : 'Unknown error'}`)
    }

    // Calculate target duration from default_duration
    const targetDuration = default_duration === '10s' ? 10 : 15

    // Create video record
    const inputMetadata = {
      title: productData.title,
      description: productData.description,
      images: productData.images,
      source_url: item.url,
      custom_title: item.custom_title,
      model: metadata.model,
      format: metadata.format,
      duration: targetDuration,
      costUsd: 0, // Calculated from credits
      costCredits,
      bulk_generated: true,
      batch_id: item.batch_id,
      batch_item_id: item.id,
    } as Json

    const { data: videoRecord, error: videoError } = await adminClient
      .from('videos')
      .insert({
        user_id: userId,
        status: 'PROCESSING' as const,
        final_script: scriptContent.script || scriptContent,
        input_metadata: inputMetadata,
        kie_task_id: null,
      })
      .select()
      .single()

    if (videoError || !videoRecord) {
      throw new Error('Failed to create video record')
    }

    // Get model information for transaction
    const selectedModel = selectModelForFormat(metadata.format)

    // Create transaction for this video
    // Note: Video record is created first to ensure we have a video_id for transaction metadata
    const { error: transactionError } = await adminClient.from('transactions').insert({
      user_id: userId,
      amount: -costCredits,
      type: 'GENERATION' as const,
      provider: 'SYSTEM' as const,
      payment_id: null,
      metadata: {
        video_id: videoRecord.id, // Link transaction to video for traceability
        model: metadata.model,
        modelName: selectedModel.name,
        format: metadata.format,
        duration: targetDuration,
        costUsd: calculateVideoCost(selectedModel, targetDuration),
        costCredits,
        source_url: item.url,
        bulk_generated: true,
        batch_id: item.batch_id,
        batch_item_id: item.id,
      } as Json
    })

    if (transactionError) {
      // Clean up video record if transaction fails to prevent orphaned records
      await adminClient.from('videos').delete().eq('id', videoRecord.id)
      throw new Error('Failed to create transaction')
    }

    // Start video generation with Kie.ai and rate limiting
    let kieTaskId: string

    try {
      await checkRateLimit('kie')

      kieTaskId = await createVideoTask({
        script: scriptContent.script || scriptContent,
        imageUrls: productData.images,
        aspectRatio: 'portrait',
        duration: targetDuration,
        model: selectedModel.kieApiModelName,
      })
    } catch (kieError) {
      // Refund transaction - critical to restore credits
      const { error: refundError } = await adminClient.from('transactions').insert({
        user_id: userId,
        amount: costCredits,
        type: 'REFUND' as const,
        provider: 'SYSTEM' as const,
        payment_id: null,
        metadata: {
          video_id: videoRecord.id, // Link refund to video for traceability
          reason: 'Kie.ai API failure',
          batch_id: item.batch_id,
          batch_item_id: item.id,
          error_message: kieError instanceof Error ? kieError.message : 'Unknown error'
        } as Json
      })

      if (refundError) {
        // CRITICAL: Credit was deducted but refund failed
        console.error('CRITICAL: Error creating refund transaction after Kie.ai failure:', {
          refundError,
          videoId: videoRecord.id,
          userId,
          costCredits,
          batchId: item.batch_id,
          batchItemId: item.id,
          originalError: kieError instanceof Error ? kieError.message : 'Unknown error'
        })
      }

      // Delete video record
      await adminClient.from('videos').delete().eq('id', videoRecord.id)
      throw new Error(`Video generation failed: ${kieError instanceof Error ? kieError.message : 'Unknown error'}`)
    }

    // Update video record with task ID
    await adminClient
      .from('videos')
      .update({
        kie_task_id: kieTaskId,
      })
      .eq('id', videoRecord.id)

    // Update batch item as completed
    await adminClient
      .from('batch_video_items')
      .update({
        status: 'COMPLETED',
        video_id: videoRecord.id,
        credits_used: costCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)

    console.log(`[Batch Item Completed] Item: ${item.id}, Video: ${videoRecord.id}`)

  } catch (error) {
    console.error(`Batch item failed ${item.id}:`, error)

    // Update batch item as failed
    await adminClient
      .from('batch_video_items')
      .update({
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
  }
}
