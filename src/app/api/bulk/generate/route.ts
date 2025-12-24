import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createVideoTask } from '@/lib/kie'
import { getFormatKey, selectModelForFormat, calculateVideoCost, usdToCredits } from '@/lib/kie-models'
import { VideoGenerationRequest, UGCContent, Json } from '@/types/supabase'
import axios from 'axios'

interface BulkGenerateRequest {
  url: string
  custom_title?: string
  style?: string
  duration?: '10s' | '30s'
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
    const body: BulkGenerateRequest = await request.json()
    const { url, custom_title, style = 'ugc_auth', duration = '30s' } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // 3. Scrape Amazon URL for product data
    let productData
    try {
      const scraperApiKey = process.env.SCRAPERAPI_KEY
      if (!scraperApiKey) {
        throw new Error('ScraperAPI key not configured')
      }

      const scraperApiUrl = 'https://api.scraperapi.com/'
      const params = new URLSearchParams({
        api_key: scraperApiKey,
        url: url,
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
        title: custom_title || data.name || '',
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
      console.error('Amazon scraping error:', scrapeError)
      return NextResponse.json({
        error: 'Failed to fetch product data from Amazon URL',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error'
      }, { status: 400 })
    }

    // 4. Generate script using AI
    let scriptContent
    try {
      const scriptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate/script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productTitle: productData.title,
          productDescription: productData.description,
          style: style,
          duration: duration,
        }),
      })

      if (!scriptResponse.ok) {
        throw new Error(`Script generation failed: ${scriptResponse.status}`)
      }

      scriptContent = await scriptResponse.json()
    } catch (scriptError) {
      console.error('Script generation error:', scriptError)
      return NextResponse.json({
        error: 'Failed to generate video script',
        details: scriptError instanceof Error ? scriptError.message : 'Unknown error'
      }, { status: 500 })
    }

    // 5. Prepare for video generation
    const format = getFormatKey(style, duration)
    const selectedModel = selectModelForFormat(format)
    const targetDuration = duration === '10s' ? 10 : 30
    const costUsd = calculateVideoCost(selectedModel, targetDuration)
    const costCredits = usdToCredits(costUsd)

    console.log(`[Bulk Video Generation] URL: ${url}, Format: ${format}, Model: ${selectedModel.name}, Cost: $${costUsd.toFixed(4)} (${costCredits} credits)`)

    // 6. Use admin client for atomic transaction
    const adminClient = createAdminClient()

    // 7. Check user's credit balance
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (userData.credits_balance < costCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${costCredits}, have ${userData.credits_balance}`
      }, { status: 402 })
    }

    // 8. Prepare metadata for video record
    const inputMetadata = {
      title: productData.title,
      description: productData.description,
      images: productData.images,
      source_url: url,
      custom_title: custom_title,
      model: selectedModel.id,
      format,
      duration: targetDuration,
      costUsd,
      costCredits,
      bulk_generated: true,
    } as Json

    // 9. Create video record
    const { data: videoRecord, error: videoError } = await adminClient
      .from('videos')
      .insert({
        user_id: user.id,
        status: 'PROCESSING' as const,
        final_script: scriptContent.script || scriptContent,
        input_metadata: inputMetadata,
        kie_task_id: null,
      })
      .select()
      .single()

    if (videoError || !videoRecord) {
      console.error('Error creating video record:', videoError)
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
    }

    // 10. Create GENERATION transaction
    const { error: transactionError } = await adminClient.from('transactions').insert({
      user_id: user.id,
      amount: -costCredits,
      type: 'GENERATION' as const,
      provider: 'SYSTEM' as const,
      payment_id: null,
      metadata: {
        model: selectedModel.id,
        modelName: selectedModel.name,
        format,
        duration: targetDuration,
        costUsd,
        costCredits,
        source_url: url,
        bulk_generated: true,
      } as Json
    })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      // Delete the video record if transaction fails
      await adminClient.from('videos').delete().eq('id', videoRecord.id)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // 11. Create video task with Kie.ai
    let kieTaskId: string
    try {
      kieTaskId = await createVideoTask({
        script: scriptContent.script || scriptContent,
        imageUrls: productData.images,
        aspectRatio: 'portrait', // Default for UGC videos
        duration: targetDuration,
        model: selectedModel.kieApiModelName,
      })
    } catch (kieError) {
      console.error('Kie.ai API error:', kieError)

      // Create refund transaction
      const { error: refundError } = await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: costCredits,
        type: 'REFUND' as const,
        provider: 'SYSTEM' as const,
        payment_id: null,
        metadata: {
          reason: 'Kie.ai API failure during bulk generation',
          originalModel: selectedModel.id,
          originalCostUsd: costUsd,
          originalCostCredits: costCredits,
          source_url: url,
        } as Json
      })

      if (refundError) {
        console.error('Error creating refund transaction:', refundError)
      }

      // Update video record to FAILED
      await adminClient
        .from('videos')
        .update({
          status: 'FAILED' as const,
          error_reason: kieError instanceof Error ? kieError.message : 'Kie.ai API call failed',
        })
        .eq('id', videoRecord.id)

      return NextResponse.json(
        {
          error: 'Failed to start video generation',
          details: kieError instanceof Error ? kieError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    // 12. Update video record with kie_task_id
    const { error: updateError } = await adminClient
      .from('videos')
      .update({
        kie_task_id: kieTaskId,
      })
      .eq('id', videoRecord.id)

    if (updateError) {
      console.error('Error updating video with task_id:', updateError)
    }

    // 13. Return success response
    return NextResponse.json({
      videoId: videoRecord.id,
      status: 'PROCESSING',
      task_id: kieTaskId,
      url: url,
      costCredits: costCredits,
    })

  } catch (error) {
    console.error('Bulk generation API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
