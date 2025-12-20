import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse, UGCContent } from '@/types/supabase'
import {
  UGC_SCRIPT_GENERATION_SYSTEM_PROMPT,
  generateScriptGenerationUserPrompt,
  validateUGCContent,
  normalizeUGCContent,
  VIDEO_GENERATION_CONFIG
} from '@/lib/prompts'

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
    const body: ScriptGenerationRequest = await request.json()
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

    // Generate user prompt using the structured prompts module
    const userPrompt = generateScriptGenerationUserPrompt({
      productName: title,
      productDescription: description,
      customersSay: description, // Using description as fallback for customers_say
    })

    const model = process.env.OPENAI_MODEL || 'gpt-4.1'
    const params = buildModelParams(model, UGC_SCRIPT_GENERATION_SYSTEM_PROMPT, userPrompt)

    const completion = await openai.chat.completions.create(params)

    const rawContent = completion.choices[0]?.message?.content?.trim()

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Failed to generate script' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let ugcContent: UGCContent;

    try {
      // The AI should return JSON directly, but we need to handle it carefully
      ugcContent = JSON.parse(rawContent);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          ugcContent = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return NextResponse.json(
            { error: 'Failed to parse AI response as JSON' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'AI response is not valid JSON' },
          { status: 500 }
        );
      }
    }

    // Validate the response structure using the prompts module
    const validation = validateUGCContent(ugcContent)
    if (!validation.isValid) {
      console.warn('UGC content validation failed:', validation.errors)
      // Continue anyway, but log the issues
    }

    // Normalize the UGC content to ensure compliance
    ugcContent = normalizeUGCContent(ugcContent)

    return NextResponse.json({
      ugcContent,
      // Keep backward compatibility
      script: ugcContent.Prompt,
      title: ugcContent.Title,
      caption: ugcContent.Caption,
      description: ugcContent.Description,
      aspectRatio: ugcContent.aspect_ratio
    })
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

