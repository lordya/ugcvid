import { NextRequest, NextResponse } from 'next/server'

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

    // Simulate API delay (1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Return mock data
    const mockData = {
      title: 'Mock Product - Premium Wireless Headphones',
      description:
        'Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design. Perfect for music lovers and professionals alike.',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop',
      ],
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Scraper API error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape product data' },
      { status: 500 }
    )
  }
}

