import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse, StructuredScriptContent } from '@/types/supabase'
import {
  generateScriptGenerationUserPrompt,
  getSystemPrompt,
  replacePromptPlaceholdersWithExamples
} from '@/lib/prompts'
import { getSuccessfulExamplesForPrompt, formatExamplesForPrompt } from '@/lib/success-examples'
import { createClient } from '@/lib/supabase/server'
import { validateStyleDuration } from '@/lib/validation'
import { jsonrepair } from 'jsonrepair'

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

// JSON Schema for Structured Script Content - guarantees valid parsing with OpenAI Structured Outputs
const STRUCTURED_SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    style: {
      type: "string",
      description: "The video style/format being used"
    },
    tone_instructions: {
      type: "string",
      description: "Instructions for the overall tone and delivery"
    },
    visual_cues: {
      type: "array",
      items: { type: "string" },
      description: "Array of visual cue descriptions with timestamps (e.g., '0-5s: Show product packaging')"
    },
    voiceover: {
      type: "array",
      items: { type: "string" },
      description: "Array of voiceover script segments matching visual_cues"
    },
    text_overlay: {
      type: "array",
      items: { type: "string" },
      description: "Optional array of text overlay cues with timestamps"
    },
    music_recommendation: {
      type: "string",
      description: "Recommended background music style or track"
    },
    hashtags: {
      type: "string",
      description: "Recommended hashtags for social media"
    },
    background_content_suggestions: {
      type: "array",
      items: { type: "string" },
      description: "Suggestions for background content/elements"
    },
    audio_design: {
      type: "array",
      items: { type: "string" },
      description: "Audio design recommendations (sound effects, music transitions, etc.)"
    },
    pacing_and_editing: {
      type: "array",
      items: { type: "string" },
      description: "Pacing and editing recommendations"
    },
    lighting_and_composition: {
      type: "array",
      items: { type: "string" },
      description: "Lighting and composition suggestions"
    },
    color_grading: {
      type: "string",
      description: "Color grading recommendations"
    },
    aspect_ratio: {
      type: "string",
      description: "Recommended aspect ratio for the video"
    },
    technical_directives: {
      type: "object",
      description: "Technical production directives including lighting, camera work, and consistency requirements",
      properties: {
        lighting: { type: "string" },
        camera: { type: "string" },
        consistency: { type: "string" }
      }
    },
    narrative_arc: {
      type: "array",
      items: { type: "string" },
      description: "Description of the narrative structure"
    },
    cinematic_techniques: {
      type: "array",
      items: { type: "string" },
      description: "Cinematic techniques and production recommendations"
    }
  },
  required: ["style", "tone_instructions", "visual_cues", "voiceover"],
  additionalProperties: false
} as const

// ROBUST JSON PARSING: Uses jsonrepair library for reliable JSON repair
function robustJsonParse(jsonString: string): StructuredScriptContent {
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.warn('Initial JSON parse failed, attempting repair with jsonrepair...')

    try {
      const repaired = jsonrepair(jsonString)
      return JSON.parse(repaired)
    } catch (repairError) {
      console.error('JSON repair failed:', repairError)
      throw new Error("Failed to repair JSON response")
    }
  }
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
    const { title, description, style, duration, language } = body

    if (!title || !description || !style || !duration) {
      return NextResponse.json(
        { error: 'Title, description, style, and duration are required' },
        { status: 400 }
      )
    }

    // Use provided language or default to English
    const targetLanguage = language || 'en'

    // Validate style and duration combination
    const validation = validateStyleDuration(style, duration)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid style or duration combination' },
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

    // Initialize Supabase client to get user ID
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch successful examples for the user (with global fallback)
    const successfulExamples = await getSuccessfulExamplesForPrompt(user.id)
    const formattedExamples = formatExamplesForPrompt(successfulExamples)

    // Initialize OpenAI client only when needed (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Construct the prompt key as ${style}_${duration}
    const promptKey = `${style}_${duration}`

    // Get the system prompt from the registry
    const systemPromptTemplate = getSystemPrompt(promptKey)

    // Replace placeholders in the system prompt and inject successful examples
    // Pass language parameter to include language instructions in the prompt
    const systemPrompt = replacePromptPlaceholdersWithExamples(
      systemPromptTemplate,
      title,
      description,
      formattedExamples,
      targetLanguage
    )

    // Generate user prompt
    const userPrompt = generateScriptGenerationUserPrompt({
      productName: title,
      productDescription: description,
      style,
      duration
    })

    const model = process.env.OPENAI_MODEL || 'gpt-4o'

    // Build OpenAI parameters with Structured Outputs for guaranteed valid parsing
    let params: any = {
      model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_script_content",
          schema: STRUCTURED_SCRIPT_SCHEMA,
          strict: true
        }
      }
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

    // Parse the JSON response - Structured Outputs should guarantee validity, but fallback to repair
    let scriptContent: StructuredScriptContent;

    try {
      // Clean the response to remove potential Markdown formatting (though Structured Outputs should prevent this)
      const cleanedContent = cleanJsonResponse(rawContent);
      scriptContent = robustJsonParse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response even after repair attempts:', parseError)
      console.error('Raw content:', rawContent)

      // Return raw content in error response for manual override fallback
      return NextResponse.json(
        {
          error: 'AI response parsing failed',
          rawContent: rawContent, // Include raw content for UI fallback
          suggestion: 'The AI generated content but it could not be formatted automatically. Please review and edit manually.'
        },
        { status: 422 } // Unprocessable Entity - content exists but needs manual intervention
      )
    }

    return NextResponse.json({
      scriptContent,
      // Keep backward compatibility - extract key fields if they exist
      script: scriptContent?.voiceover?.join(' ') || '',
      title: scriptContent?.style || `${style} (${duration})`,
      description: scriptContent?.tone_instructions || description,
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

