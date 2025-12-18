import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // System prompt for UGC script generation
    const systemPrompt = `You are an expert UGC video scripter. Create a 30-second viral TikTok script for the following product. 

The script should follow this structure:
- Hook (first 3-5 seconds): Grab attention immediately
- Body (20-25 seconds): Highlight key features and benefits
- CTA (last 2-3 seconds): Clear call-to-action

Return ONLY the raw text of the script (no markdown, no "Here is your script", no explanations, just the script text).`

    const userPrompt = `Product Title: ${title}

Product Description: ${description}

Create a 30-second UGC-style script that would go viral on TikTok.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-nano', // Use gpt-5-nano as default
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const script = completion.choices[0]?.message?.content?.trim()

    if (!script) {
      return NextResponse.json(
        { error: 'Failed to generate script' },
        { status: 500 }
      )
    }

    return NextResponse.json({ script })
  } catch (error) {
    console.error('Script generation API error:', error)
    
    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}

