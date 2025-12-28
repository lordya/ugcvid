import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as ipaddr from 'ipaddr.js'

// Helper function to validate URLs and prevent SSRF attacks
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }

    const hostname = url.hostname

    // Block localhost and common internal hostnames
    if (hostname.toLowerCase() === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0') {
      return false
    }

    // Use ipaddr.js for comprehensive IP address validation
    try {
      const addr = ipaddr.parse(hostname)

      // Check if it's a valid public IP address
      if (addr.kind() === 'ipv4') {
        // Block private IPv4 ranges
        if (addr.range() !== 'unicast') {
          return false
        }
      } else if (addr.kind() === 'ipv6') {
        // Block private IPv6 ranges (ULA fc00::/7, link-local fe80::/10, etc.)
        if (addr.range() !== 'unicast') {
          return false
        }
      }
    } catch (ipError) {
      // Not an IP address, continue with hostname validation
      // Additional hostname blocking for internal networks
      if (hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false
      }
    }

    return true
  } catch (error) {
    // Invalid URL format
    return false
  }
}

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

    // Validate URL format and prevent SSRF attacks
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format or access to internal/private resources is not allowed' },
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

    // WATERFALL EXTRACTION: Try multiple data sources for title and description
    // 1. Waterfall for Title - prioritize specific product fields, then fall back to generic page metadata
    const title =
      data.name ||
      data.title ||
      data.open_graph?.title ||
      data.twitter_card?.title ||
      'Untitled Product'

    // 2. Waterfall for Description - prioritize detailed descriptions, then fall back to metadata
    const description =
      data.full_description ||
      data.description ||
      data.open_graph?.description ||
      data.twitter_card?.description ||
      'No description available'

    const images = Array.isArray(data.images) ? data.images : []

    // SOFT FAILURE: Only fail if we found literally nothing useful
    if (!title && !description) {
      console.error('ScraperAPI response contained no usable title or description fields')
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

