import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse, StructuredScriptContent } from '@/types/supabase'
import {
  generateScriptGenerationUserPrompt,
  getSystemPrompt,
  replacePromptPlaceholdersWithExamples,
  SCRIPT_GENERATION_SCHEMA
} from '@/lib/prompts'
import { getModelPromptByKey } from '@/lib/db/model-prompts'
import { getSuccessfulExamplesForPrompt, formatExamplesForPrompt } from '@/lib/success-examples'
import { createClient } from '@/lib/supabase/server'
import { validateStyleDuration } from '@/lib/validation'
import {
  getModelForScriptGeneration,
  getModelConstraints,
  enhancePromptWithModelGuidance,
  validateScriptAgainstModel,
  getModelInfoForResponse
} from '@/lib/model-aware-script'

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

    // Fetch user profile for quality tier information
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('quality_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const userQualityTier = userProfile.quality_tier || 'standard'

    // Select optimal model for script generation
    const selectedModel = getModelForScriptGeneration(style, duration, undefined, userQualityTier)
    const modelConstraints = await getModelConstraints(selectedModel)

    console.log(`[Script Generation] Selected model: ${selectedModel.name} (${selectedModel.id}) for ${style}_${duration}`)

    // Initialize OpenAI client only when needed (not at module level)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Construct the prompt key as ${style}_${duration}
    const promptKey = `${style}_${duration}`

    // Try to get the system prompt from database first, fallback to hardcoded prompts
    let systemPromptTemplate = ''

    try {
      const dbPrompt = await getModelPromptByKey(promptKey)
      if (dbPrompt) {
        systemPromptTemplate = dbPrompt.system_prompt
        console.log(`[Script Generation] Using database prompt for ${promptKey}`)
      } else {
        console.log(`[Script Generation] Database prompt not found for ${promptKey}, falling back to hardcoded`)
        systemPromptTemplate = await getSystemPrompt(promptKey)
      }
    } catch (error) {
      console.warn(`[Script Generation] Database query failed for ${promptKey}, falling back to hardcoded:`, error)
      systemPromptTemplate = await getSystemPrompt(promptKey)
    }

    // Replace placeholders in the system prompt and inject successful examples
    // Pass language parameter to include language instructions in the prompt
    let systemPrompt = replacePromptPlaceholdersWithExamples(
      systemPromptTemplate,
      title,
      description,
      formattedExamples,
      targetLanguage,
      undefined, // modelGuidance is handled separately below
      selectedModel,
      promptKey
    )

    // Enhance system prompt with model-specific guidance
    systemPrompt = await enhancePromptWithModelGuidance(systemPrompt, selectedModel, modelConstraints)

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
          name: "script_generation",
          strict: true,
          schema: SCRIPT_GENERATION_SCHEMA
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

    // Parse the JSON response - Structured Outputs guarantee valid JSON
    const scriptContent: StructuredScriptContent = JSON.parse(rawContent)

    // Validate script against model constraints
    const validationResult = validateScriptAgainstModel(scriptContent, selectedModel)

    // Log validation results
    if (!validationResult.isValid) {
      console.warn(`[Script Validation] Script validation failed for ${selectedModel.name}:`, validationResult.warnings)
    }

    return NextResponse.json({
      scriptContent,
      // Keep backward compatibility - extract key fields if they exist
      script: scriptContent?.voiceover?.join(' ') || '',
      title: scriptContent?.style || `${style} (${duration})`,
      description: scriptContent?.tone_instructions || description,
      // Include model information and validation results
      model: getModelInfoForResponse(selectedModel, modelConstraints),
      validation: {
        isValid: validationResult.isValid,
        warnings: validationResult.warnings,
        suggestions: validationResult.suggestions,
        estimatedDuration: validationResult.estimatedDuration
      }
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

