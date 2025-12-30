import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ScriptGenerationRequest, ScriptGenerationResponse, StructuredScriptContent, AdvancedScriptGenerationResponse } from '@/types/supabase'
import { QualityTier } from '@/lib/prompts'
import {
  generateScriptGenerationUserPrompt,
  getSystemPrompt,
  replacePromptPlaceholdersWithExamples,
  replacePromptPlaceholdersWithAngles,
  SCRIPT_GENERATION_SCHEMA
} from '@/lib/prompts'
import { selectAngles, saveVideoScripts, SelectedAngle } from '@/lib/script-engine'
import { getModelPromptByKey } from '@/lib/db/model-prompts'
import { getSuccessfulExamplesForPrompt, formatExamplesForPrompt } from '@/lib/success-examples'
import { getModelForScriptGeneration } from '@/lib/model-aware-script'
import { createClient } from '@/lib/supabase/server'
import { validateStyleDuration } from '@/lib/validation'
import {
  getModelConstraints,
  enhancePromptWithModelGuidance,
  validateScriptAgainstModel,
  getModelInfoForResponse
} from '@/lib/model-aware-script'

// Helper to determine if model uses max_completion_tokens (newer models) or max_tokens (older models)
function shouldUseMaxCompletionTokens(model: string): boolean {
  // GPT-5 models and newer models like GPT-4o, GPT-4-turbo, etc. use max_completion_tokens
  return model.startsWith('gpt-5') ||
         model.includes('gpt-4o') ||
         model.includes('gpt-4-turbo') ||
         model.includes('gpt-4-0125') ||
         model.includes('gpt-4-1106')
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

  if (shouldUseMaxCompletionTokens(model)) {
    // Newer models use max_completion_tokens
    return {
      ...baseParams,
      max_completion_tokens: parseInt(
        process.env.OPENAI_MAX_COMPLETION_TOKENS || '500',
        10
      ),
    }
  } else {
    // Older models use temperature, max_tokens
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
    const { title, description, style, duration, language, video_id, manual_angle_ids, mode, angleId } = body

    if (!title || !description || !style || !duration) {
      return NextResponse.json(
        { error: 'Title, description, style, and duration are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client and authenticate user first
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if this is advanced script generation (with angles)
    const isAdvancedGeneration = video_id !== undefined || manual_angle_ids !== undefined || mode === 'auto' || angleId !== undefined

    // Use provided language or default to English
    const targetLanguage = language || 'en'

    // Fetch user profile for quality tier information (needed for both generation types)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('quality_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const userQualityTier: QualityTier = (userProfile.quality_tier === 'premium' ? 'premium' : 'standard')

    // Handle advanced script generation
    if (isAdvancedGeneration) {
      // Determine which angles to use based on mode and angleId
      let anglesToUse: string[] | undefined = manual_angle_ids

      if (mode === 'single' && angleId) {
        // Generate only the specific angle
        anglesToUse = [angleId]
      } else if (mode === 'auto' || (!manual_angle_ids && !angleId)) {
        // Generate 3 random angles (existing behavior)
        anglesToUse = undefined
      }

      const result = await generateAdvancedScripts(
        title,
        description,
        style,
        duration,
        targetLanguage,
        video_id,
        anglesToUse,
        user.id,
        userQualityTier,
        supabase
      )

      return NextResponse.json(result)
    }

    // Continue with legacy single script generation

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

    // Fetch successful examples for the user (with global fallback)
    const successfulExamples = await getSuccessfulExamplesForPrompt(user.id)
    const formattedExamples = formatExamplesForPrompt(successfulExamples)

    // Select optimal model for script generation
    const selectedModel = getModelForScriptGeneration(style, duration, undefined, userQualityTier as QualityTier)
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
    if (shouldUseMaxCompletionTokens(model)) {
      // Newer models use max_completion_tokens
      params.max_completion_tokens = parseInt(
        process.env.OPENAI_MAX_COMPLETION_TOKENS || '2000',
        10
      )
    } else {
      // Older models use max_tokens
      params.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10)
    }

    // Add temperature for all models (not needed for some reasoning models)
    if (!model.startsWith('gpt-5')) {
      params.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.8')
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

/**
 * Advanced script generation with parallel angle-based generation
 */
async function generateAdvancedScripts(
  title: string,
  description: string,
  style: string,
  duration: string,
  language: string | undefined,
  video_id: string | undefined,
  manual_angle_ids: string[] | undefined,
  userId: string,
  userQualityTier: string,
  supabase: any
): Promise<AdvancedScriptGenerationResponse> {
  // Select angles for generation
  const selectedAngles = await selectAngles(manual_angle_ids)
  console.log(`[Advanced Script Generation] Selected ${selectedAngles.length} angles:`, selectedAngles.map(a => a.id))

  // Fetch successful examples for the user
  const successfulExamples = await getSuccessfulExamplesForPrompt(userId)
  const formattedExamples = formatExamplesForPrompt(successfulExamples)

  // Select optimal model for script generation
  const selectedModel = getModelForScriptGeneration(style, duration, undefined, userQualityTier as QualityTier)
  const modelConstraints = await getModelConstraints(selectedModel)

  console.log(`[Advanced Script Generation] Selected model: ${selectedModel.name} (${selectedModel.id}) for ${style}_${duration}`)

  // Initialize OpenAI client
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Get the God Mode system prompt
  const systemPromptTemplate = await getSystemPrompt('god_mode_script')

  // Generate user prompt
  const userPrompt = generateScriptGenerationUserPrompt({
    productName: title,
    productDescription: description,
    style,
    duration
  })

  // Generate scripts for all angles in parallel
  const generationPromises = selectedAngles.map(async (angle: SelectedAngle) => {
    try {
      console.log(`[Advanced Script Generation] Generating script for angle: ${angle.id}`)

      // Enhance system prompt with angle-specific content
      const systemPrompt = replacePromptPlaceholdersWithAngles(
        systemPromptTemplate,
        angle.keywords_string,
        angle.description,
        angle.prompt_template,
        formattedExamples,
        language,
        undefined, // modelGuidance handled separately
        selectedModel,
        `${style}_${duration}`
      )

      // For advanced generation, we want clean text output, not JSON
      const model = process.env.OPENAI_MODEL || 'gpt-4o'
      const completionParams: any = {
        model,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ],
      }

      // Add the appropriate max tokens parameter based on model
      if (shouldUseMaxCompletionTokens(model)) {
        completionParams.max_completion_tokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '500', 10)
      } else {
        completionParams.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10)
        completionParams.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.8')
      }

      const completion = await openai.chat.completions.create(completionParams)

      const content = completion.choices[0]?.message?.content?.trim()

      if (!content) {
        throw new Error('OpenAI API returned empty response')
      }

      return {
        angle: {
          id: angle.id,
          label: angle.label,
          description: angle.description,
          keywords: angle.keywords
        },
        content
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Advanced Script Generation] Error generating script for angle ${angle.id}:`, errorMessage)

      // Return a fallback script instead of throwing to allow other angles to succeed
      const fallbackContent = `Unable to generate script for ${angle.label}. ${errorMessage.includes('rate limit') ? 'Please wait a moment and try again.' : 'Please try again or select a different angle.'}`

      return {
        angle: {
          id: angle.id,
          label: angle.label,
          description: angle.description,
          keywords: angle.keywords
        },
        content: fallbackContent,
        isFallback: true,
        error: errorMessage
      }
    }
  })

  // Wait for all scripts to be generated
  const generatedScripts = await Promise.all(generationPromises)

  // Filter out fallback scripts (failed generations)
  const successfulScripts = generatedScripts.filter(script => !script.isFallback)

  // If no scripts succeeded, return an error
  if (successfulScripts.length === 0) {
    throw new Error('Failed to generate any scripts. Please try again.')
  }

  // Log warning if some scripts failed
  if (successfulScripts.length < generatedScripts.length) {
    const failedCount = generatedScripts.length - successfulScripts.length
    console.warn(`[Advanced Script Generation] ${failedCount} out of ${generatedScripts.length} script generations failed`)
  }

  // Save to database if video_id is provided (only successful scripts)
  let savedScripts: any[] = []
  if (video_id) {
    try {
      savedScripts = await saveVideoScripts(
        successfulScripts.map(script => ({
          video_id,
          angle_id: script.angle.id,
          content: script.content
        }))
      )
      console.log(`[Advanced Script Generation] Saved ${savedScripts.length} scripts to database`)
    } catch (error) {
      console.error('[Advanced Script Generation] Error saving scripts to database:', error)
      // Continue with response even if saving fails
    }
  }

  return {
    scripts: successfulScripts.map((script, index) => ({
      ...script,
      confidence: 0.8, // Default confidence score
      video_script_id: savedScripts[index]?.id
    })),
    script: successfulScripts[0]?.content || '', // First successful script as default
    title: title,
    description: description,
    model: getModelInfoForResponse(selectedModel, modelConstraints)
  }
}

