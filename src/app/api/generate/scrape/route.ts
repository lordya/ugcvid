import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Check if ScraperAPI key is configured
    const scraperApiKey = process.env.SCRAPERAPI_KEY
    if (!scraperApiKey) {
      console.error('SCRAPERAPI_KEY is not configured')
      return NextResponse.json(
        { error: 'ScraperAPI is not configured' },
        { status: 500 }
      )
    }

    // Make request to ScraperAPI with autoparse enabled
    const scraperApiUrl = 'https://api.scraperapi.com/'
    const params = new URLSearchParams({
      api_key: scraperApiKey,
      url: url,
      autoparse: 'true',
    })

    let response
    try {
      response = await axios.get(scraperApiUrl, {
        params: params,
        timeout: 30000, // 30 second timeout
      })
    } catch (axiosError: any) {
      // Handle ScraperAPI errors
      if (axiosError.response) {
        const status = axiosError.response.status
        if (status === 403 || status === 500) {
          console.error('ScraperAPI error:', status, axiosError.response.data)
          return NextResponse.json(
            { error: 'Could not fetch product data' },
            { status: 500 }
          )
        }
      }
      // Network or other errors
      console.error('ScraperAPI request failed:', axiosError.message)
      return NextResponse.json(
        { error: 'Could not fetch product data' },
        { status: 500 }
      )
    }

    // Validate response structure
    if (!response.data) {
      console.error('ScraperAPI returned empty response')
      return NextResponse.json(
        { error: 'Could not fetch product data' },
        { status: 500 }
      )
    }

    const data = response.data

    // Map ScraperAPI response to frontend format
    const title = data.name || ''
    const description = data.full_description || data.description || ''
    const images = Array.isArray(data.images) ? data.images : []

    // Validate required fields
    if (!title || !description) {
      console.error('ScraperAPI response missing required fields:', { title, description })
      return NextResponse.json(
        { error: 'Could not fetch product data' },
        { status: 500 }
      )
    }

    // Return mapped data
    const mappedData = {
      title,
      description,
      images: images.length > 0 ? images : [],
      // Optional fields for future use
      ...(data.pricing && { price: data.pricing }),
      ...(data.average_rating && { rating: data.average_rating }),
      ...(data.customers_say?.summary && { reviews_summary: data.customers_say.summary }),
    }

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error('Scraper API error:', error)
    return NextResponse.json(
      { error: 'Could not fetch product data' },
      { status: 500 }
    )
  }
}

