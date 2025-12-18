import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Helper to determine if model uses GPT-5 style parameters
function isGPT5Model(model: string): boolean {
  return model.startsWith('gpt-5')
}

// Build model-specific parameters
function buildModelParams(
  model: string,
  systemPrompt: string,
  userPrompt: string
) {
  const baseParams = {
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
  }

  if (isGPT5Model(model)) {
    // GPT-5 models use reasoning_effort, verbosity, max_completion_tokens
    return {
      ...baseParams,
      reasoning_effort: (process.env.OPENAI_REASONING_EFFORT || 'minimal') as
        | 'minimal'
        | 'low'
        | 'medium'
        | 'high',
      verbosity: (process.env.OPENAI_VERBOSITY || 'medium') as
        | 'low'
        | 'medium'
        | 'high',
      max_completion_tokens: parseInt(
        process.env.OPENAI_MAX_COMPLETION_TOKENS || '500',
        10
      ),
    }
  } else {
    // Traditional models use temperature, max_tokens
    return {
      ...baseParams,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    }
  }
}

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

    // Initialize OpenAI client only when needed (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    const model = process.env.OPENAI_MODEL || 'gpt-5-nano'
    const params = buildModelParams(model, systemPrompt, userPrompt)

    const completion = await openai.chat.completions.create(params)

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

