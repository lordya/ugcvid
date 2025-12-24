import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse } from '@/types/supabase'
import {
  generateScriptGenerationUserPrompt,
  getSystemPrompt,
  replacePromptPlaceholders
} from '@/lib/prompts'

// Helper to determine if model uses GPT-5 style parameters
function isGPT5Model(model: string): boolean {
  return model.startsWith('gpt-5')
}

// Helper function to clean JSON responses from LLMs that may include Markdown formatting
function cleanJsonResponse(rawContent: string): string {
  let cleaned = rawContent.trim()

  // Remove Markdown code blocks if present
  const jsonCodeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i
  const match = cleaned.match(jsonCodeBlockRegex)
  if (match) {
    cleaned = match[1].trim()
  }

  return cleaned
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
    const { title, description, style, duration } = body

    if (!title || !description || !style || !duration) {
      return NextResponse.json(
        { error: 'Title, description, style, and duration are required' },
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

    // Construct the prompt key as ${style}_${duration}
    const promptKey = `${style}_${duration}`

    // Get the system prompt from the registry
    const systemPromptTemplate = getSystemPrompt(promptKey)

    // Replace placeholders in the system prompt
    const systemPrompt = replacePromptPlaceholders(systemPromptTemplate, title, description)

    // Generate user prompt
    const userPrompt = generateScriptGenerationUserPrompt({
      productName: title,
      productDescription: description,
      style,
      duration
    })

    const model = process.env.OPENAI_MODEL || 'gpt-4o'

    // Build OpenAI parameters with JSON response format
    let params: any = {
      model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt },
      ],
      response_format: { type: "json_object" }
    }

    // Add model-specific parameters
    if (isGPT5Model(model)) {
      // GPT-5 models use reasoning_effort, verbosity, max_completion_tokens
      params.reasoning_effort = (process.env.OPENAI_REASONING_EFFORT || 'minimal') as
        | 'minimal'
        | 'low'
        | 'medium'
        | 'high'
      params.verbosity = (process.env.OPENAI_VERBOSITY || 'medium') as
        | 'low'
        | 'medium'
        | 'high'
      params.max_completion_tokens = parseInt(
        process.env.OPENAI_MAX_COMPLETION_TOKENS || '2000',
        10
      )
    } else {
      // Traditional models use temperature, max_tokens
      params.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.8')
      params.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10)
    }

    const completion = await openai.chat.completions.create(params)

    const rawContent = completion.choices[0]?.message?.content?.trim()

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Failed to generate script' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let scriptContent;

    try {
      // Clean the response to remove potential Markdown formatting
      const cleanedContent = cleanJsonResponse(rawContent);
      scriptContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('Raw content:', rawContent)
      return NextResponse.json(
        { error: 'AI response is not valid JSON' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      scriptContent,
      // Keep backward compatibility - extract key fields if they exist
      script: scriptContent?.voiceover?.join(' ') || scriptContent?.script || '',
      title: scriptContent?.style || `${style} (${duration})`,
      description: scriptContent?.description || description,
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

