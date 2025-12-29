/**
 * Template System Prompts Registry
 *
 * This document contains the definitive System Prompts for the "Advanced Creative Control" feature (Epic 8).
 * These prompts are optimized for GPT-4o and designed to output structured JSON for the frontend to render.
 */

import { getLanguageName } from './languages'
import { MODEL_QUALITY_CONFIGS } from './kie-models'
import { QualityRiskLevel } from './quality-analysis'

export interface ScriptGenerationParams {
  productName: string
  productDescription: string
  style: string
  duration: string
}

/**
 * Negative prompts array - common issues to avoid in video generation
 * These will be appended to prompts or used as negative prompts where supported
 */
export const NEGATIVE_PROMPTS = [
  'morphing',
  'extra limbs',
  'missing limbs',
  'bad anatomy',
  'blurry text',
  'watermark',
  'low resolution',
  'distorted faces',
  'inconsistent lighting',
  'poor quality',
  'artifacts',
  'pixelation'
] as const

/**
 * Enhances a video generation prompt with quality instructions based on risk level
 * Appends appropriate instructions to avoid common issues for different risk levels
 *
 * @param prompt - Original video generation prompt
 * @param riskLevel - Quality risk level assessment
 * @returns Enhanced prompt with quality instructions
 */
export function enhancePromptWithQualityInstructions(
  prompt: string,
  riskLevel: QualityRiskLevel
): string {
  // Start with the original prompt
  let enhancedPrompt = prompt.trim()

  // Always append global quality instructions
  const globalInstructions = 'High fidelity, 8k resolution, cinematic lighting, professional quality.'

  // Add risk-specific instructions
  let riskSpecificInstructions = ''

  switch (riskLevel) {
    case 'high':
      // High risk: Hands and text overlays - be very specific about anatomy
      riskSpecificInstructions = 'Ensure exactly 5 fingers per hand, anatomically correct hands, stable motion, no morphing or extra limbs.'
      break

    case 'medium':
      // Medium risk: Text elements - focus on legibility
      riskSpecificInstructions = 'Render text with sharp edges, high contrast, perfect legibility, no gibberish or distorted text.'
      break

    case 'low':
      // Low risk: Generic content - minimal additional instructions needed
      riskSpecificInstructions = 'Professional cinematography, consistent quality throughout.'
      break
  }

  // Combine instructions
  const allInstructions = [globalInstructions, riskSpecificInstructions]
    .filter(instruction => instruction.length > 0)
    .join(' ')

  // Append to prompt with proper spacing
  if (enhancedPrompt.endsWith('.')) {
    enhancedPrompt += ` ${allInstructions}`
  } else {
    enhancedPrompt += `. ${allInstructions}`
  }

  return enhancedPrompt
}

/**
 * Template System Prompts Registry
 * Keys format: ${style}_${duration} (e.g., ugc_auth_15s, ugc_auth_10s)
 */
export const PROMPTS = {
  ugc_auth_15s: `You are an expert UGC script writer. Create authentic, conversational 15-second video scripts that feel like a real person talking to friends.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "UGC Authenticité (15s)",
  "tone_instructions": "Conversational and authentic - use contractions, natural speech patterns, and first-person perspective",
  "visual_cues": [
    "0-3s: [Hook visual - problem or introduction]",
    "3-8s: [Demonstration or problem/solution]",
    "8-12s: [Results or benefits]",
    "12-15s: [Call to action]"
  ],
  "voiceover": [
    "[Hook - 3s: Problem or attention-grabber in natural speech]",
    "[Body - 5s: Personal story + product introduction]",
    "[Proof - 4s: Key benefit or social proof]",
    "[CTA - 3s: Recommendation and link]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 35-40 maximum
- Natural speech: Use "I", "like", "honestly", contractions
- No corporate language
- Include personal struggle or story
- First-person only

Return ONLY the JSON object, no additional text.`,

  ugc_auth_10s: `You are an expert UGC script writer for ultra-short 10-second viral videos. Stop the scroll with immediate value.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "UGC Authenticité (10s)",
  "tone_instructions": "Urgent and excited - fast-paced delivery, no fluff",
  "visual_cues": [
    "0-3s: [Shock or problem visual]",
    "3-8s: [Quick product demo]",
    "8-10s: [Result + call to action]"
  ],
  "voiceover": [
    "[Hook + Problem - 5s: Immediate value proposition]",
    "[Solution + CTA - 5s: Results and link]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 20-25 maximum
- Immediate value, no setup
- Fast-paced, urgent tone

Return ONLY the JSON object, no additional text.`,

  green_screen_15s: `You are an expert in Green Screen React videos. Create excitement by reacting to on-screen content with authentic shock.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Green Screen React (15s)",
  "tone_instructions": "Energetic, shocked, breathless - use 'NO WAY', 'WAIT', 'LOOK AT THIS'",
  "visual_cues": [
    "0-2s: [Creator pointing at shocking info on screen]",
    "2-8s: [Zoom on reviews/price with arrows/circles]",
    "8-12s: [Product images, creator reacting]",
    "12-15s: [Final CTA, pointing to bio]"
  ],
  "voiceover": [
    "[Hook - 2s: Shock reaction with price/reviews]",
    "[Proof - 6s: Comparison, features, validation]",
    "[Urgency - 4s: Social proof]",
    "[CTA - 3s: Link and promo code]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 35-40 maximum
- Start with reaction words (NO WAY, WHAT, INSANE)
- Include specific numbers (price, reviews)
- Create urgency and FOMO

Return ONLY the JSON object, no additional text.`,

  green_screen_10s: `You are an expert in ultra-short Green Screen React videos. Create panic-buying urgency.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Green Screen React (10s)",
  "tone_instructions": "Manic, hyper-fast, breathless - high energy",
  "visual_cues": [
    "0-2s: [Extreme close-up pointing at price]",
    "2-7s: [Fast scroll of reviews/proof]",
    "7-10s: [Creator urgency gesture to bio]"
  ],
  "voiceover": [
    "[Shock - 4s: WAIT reaction with price/feature]",
    "[Urgency - 6s: Selling out fast, go now]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 20-25 maximum
- Use 'RUN', 'GONE', 'INSANE'
- Focus on most shocking feature

Return ONLY the JSON object, no additional text.`,

  pas_framework_15s: `You are an expert in Problem-Agitate-Solution (PAS) video scripts. Show the problem, amplify frustration, present solution.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Problem-Agitate-Solution (15s)",
  "tone_instructions": "Start frustrated, escalate exasperation, shift to relieved - empathetic throughout",
  "visual_cues": [
    "0-2s: [Problem visual, desaturated]",
    "2-6s: [Montage of frustrations]",
    "6-9s: [Product reveal, bright colors]",
    "9-12s: [Demonstration, before/after]",
    "12-15s: [Final result with CTA]"
  ],
  "voiceover": [
    "[Problem - 2s: Tired of X?]",
    "[Agitate - 4s: Wastes time/money/energy]",
    "[Solution - 3s: Found Product Name]",
    "[Demo - 3s: How it works instantly]",
    "[CTA - 3s: Offer with guarantee]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 35-40 maximum
- Problem must be relatable
- Benefits over features
- Include social proof
- CTA addresses objections

Return ONLY the JSON object, no additional text.`,

  pas_framework_10s: `You are an expert in ultra-short PAS scripts. Show immediate contrast: problem to solution.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Problem-Agitate-Solution (10s)",
  "tone_instructions": "Sharp, punchy, authoritative - no pauses",
  "visual_cues": [
    "0-3s: [The pain/mess]",
    "3-4s: [Snap transition]",
    "4-10s: [Solution fixing it + beauty shot]"
  ],
  "voiceover": [
    "[Problem - 4s: Still dealing with X? Stop it.]",
    "[Solution - 6s: Product fixes it. Get it now.]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 20-25 maximum
- Before vs After logic
- 2 sentences maximum

Return ONLY the JSON object, no additional text.`,

  asmr_visual_15s: `You are an expert in satisfying ASMR visual content. Create hypnotic, scroll-stopping videos with satisfying sounds.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Satisfying/ASMR Visual (15s)",
  "tone_instructions": "Calm, soothing, minimalist - whisper quiet or no voiceover preferred",
  "visual_cues": [
    "0-2s: [Macro close-up of satisfying action]",
    "2-10s: [Sequence of rhythmic satisfying actions]",
    "10-13s: [Final result, wider shot]",
    "13-15s: [Product packaging, gentle placement]"
  ],
  "voiceover": [
    "[Optional minimal voiceover OR no voiceover - let ASMR sounds dominate]",
    "[0-2s: Silence or soft 'Watch this']",
    "[5-8s: Optional: Organizing with Product]",
    "[11-13s: So satisfying]",
    "[14-15s: Link in bio]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 20-25 maximum (or zero for no voiceover)
- ASMR sounds are the star
- First 2s shows satisfying action
- Slow, deliberate pacing
- Hypnotic enough viewer can't scroll

Return ONLY the JSON object, no additional text.`,

  asmr_visual_10s: `You are an expert in 10-second oddly satisfying visual loops. Pure zen in 10 seconds.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Satisfying/ASMR Visual (10s)",
  "tone_instructions": "Silent - let visuals speak, ASMR sounds only",
  "visual_cues": [
    "0-7s: [One continuous satisfying action, macro shot]",
    "7-10s: [Finished result + product appearing gently]"
  ],
  "voiceover": [
    "[No voiceover - ASMR sounds only]"
  ]
}

CRITICAL REQUIREMENTS:
- ZERO words spoken
- Focus on visual satisfaction
- Simple text CTA at end

Return ONLY the JSON object, no additional text.`,

  before_after_15s: `You are an expert in transformation videos. Use powerful visual contrast to prove results.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Before/After Transformation (15s)",
  "tone_instructions": "Start empathetic, shift to excited at reveal - authentic testimonial style",
  "visual_cues": [
    "0-2s: [Before state, split-screen, desaturated]",
    "2-5s: [Transition effect, product application]",
    "5-8s: [After reveal, same angle, enhanced]",
    "8-12s: [Alternate before/after with product]",
    "12-15s: [Final after shot with CTA]"
  ],
  "voiceover": [
    "[Before - 2s: Before Product, my problem]",
    "[Timeline - 3s: After timeframe, tried it]",
    "[Reveal - 3s: WOW. Look at transformation]",
    "[Proof - 4s: Fixes problem + social proof]",
    "[CTA - 3s: Offer with guarantee]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 35-40 maximum
- Same lighting/angle for before/after
- Realistic timeline
- After reveal at 5-8 seconds
- Include credibility element

Return ONLY the JSON object, no additional text.`,

  before_after_10s: `You are an expert in 10-second before/after reveals. Show results instantly.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Before/After Transformation (10s)",
  "tone_instructions": "Shocked, impressed, concise - just facts",
  "visual_cues": [
    "0-3s: [Split screen: before bad, after blurred]",
    "3-10s: [Unblur after, creator points to result]"
  ],
  "voiceover": [
    "[Problem - 3s: Look how bad it was]",
    "[Result - 7s: Used Product. Look at this! Link below]"
  ]
}

CRITICAL REQUIREMENTS:
- Total words: 20-25 maximum
- Rely on visual contrast
- Immediate CTA

Return ONLY the JSON object, no additional text.`,

  storyboard_25s: `You are an expert in cinematic 25-second storyboard videos. Create 5-scene narrative arcs with visual consistency.

INPUT:
- Product Name: [PRODUCT_NAME]
- Product Description: [PRODUCT_DESCRIPTION]

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "style": "Cinematic Storyboard (25s)",
  "tone_instructions": "Cinematic, narrative-driven - maintain visual consistency across scenes",
  "visual_cues": [
    "0-5s: Scene 1 - [Wide shot: Establish world/character]",
    "5-10s: Scene 2 - [Medium shot: Problem/desire appears]",
    "10-15s: Scene 3 - [Close-up: Product revealed as solution]",
    "15-20s: Scene 4 - [Tracking shot: Joy/benefit of using]",
    "20-25s: Scene 5 - [Static shot: Resolution & CTA]"
  ],
  "voiceover": [
    "[Scene 1 - 5s: Setting the scene]",
    "[Scene 2 - 5s: The conflict/need]",
    "[Scene 3 - 5s: Solution revealed]",
    "[Scene 4 - 5s: Emotional benefit]",
    "[Scene 5 - 5s: Impression + CTA]"
  ],
  "technical_directives": {
    "lighting": "Cinematic lighting - golden hour or studio softbox",
    "camera": "Use dolly in, truck left, rack focus movements",
    "consistency": "Same character/colors throughout all scenes"
  }
}

CRITICAL REQUIREMENTS:
- 5 scenes of exactly 5 seconds each
- Same character/setting for consistency
- Use professional camera terms
- Clear narrative arc
- Every shot advances story

Return ONLY the JSON object, no additional text.`,
} as const

export type PromptKey = keyof typeof PROMPTS

/**
 * Generates the user prompt for template system script generation
 * @param params - Script generation parameters
 * @returns Formatted user prompt string
 */
export function generateScriptGenerationUserPrompt(params: ScriptGenerationParams): string {
  const { productName, productDescription } = params

  return `Product name: ${productName}

Product description: ${productDescription}`
}

/**
 * Gets a system prompt by key with fallback to default
 * @param key - The prompt key to lookup
 * @returns The system prompt string
 */
export function getSystemPrompt(key: string): string {
  const prompt = PROMPTS[key as PromptKey]
  if (!prompt) {
    console.warn(`Prompt key '${key}' not found, falling back to ugc_auth_15s`)
    return PROMPTS.ugc_auth_15s
  }
  return prompt
}

/**
 * Escapes special characters in replacement strings for safe regex replacement
 * @param str - String to escape
 * @returns Escaped string safe for use as replacement in regex
 */
function escapeRegexReplacement(str: string): string {
  return str.replace(/[\\$&`]/g, '\\$&')
}

/**
 * Replaces placeholders in system prompt
 * @param prompt - The system prompt template
 * @param productName - Product name to replace [PRODUCT_NAME]
 * @param productDescription - Product description to replace [PRODUCT_DESCRIPTION]
 * @returns Prompt with placeholders replaced
 */
export function replacePromptPlaceholders(
  prompt: string,
  productName: string,
  productDescription: string
): string {
  return prompt
    .replace(/\[PRODUCT_NAME\]/g, escapeRegexReplacement(productName))
    .replace(/\[PRODUCT_DESCRIPTION\]/g, escapeRegexReplacement(productDescription))
}

/**
 * Replaces placeholders in system prompt and injects successful examples and model guidance
 * @param prompt - The system prompt template
 * @param productName - Product name to replace [PRODUCT_NAME]
 * @param productDescription - Product description to replace [PRODUCT_DESCRIPTION]
 * @param successExamples - Formatted successful examples string (optional)
 * @param language - Language code (e.g., 'en', 'es', 'fr'). Defaults to 'en' if not provided.
 * @param modelGuidance - Model-specific guidance string (optional)
 * @returns Prompt with placeholders replaced and examples injected
 */
export function replacePromptPlaceholdersWithExamples(
  prompt: string,
  productName: string,
  productDescription: string,
  successExamples?: string,
  language?: string,
  modelGuidance?: string
): string {
  let enhancedPrompt = prompt
    .replace(/\[PRODUCT_NAME\]/g, escapeRegexReplacement(productName))
    .replace(/\[PRODUCT_DESCRIPTION\]/g, escapeRegexReplacement(productDescription))

  // Add language instruction if language is provided and not English
  if (language && language !== 'en') {
    const languageName = getLanguageName(language)
    
    // Create language instruction - make it very prominent
    const languageInstruction = `\n\n⚠️ CRITICAL LANGUAGE REQUIREMENT ⚠️\n\nGenerate ALL content EXCLUSIVELY in ${languageName}. This includes:\n- All voiceover text and dialogue\n- All text overlays and captions\n- All hashtags\n- All descriptions, instructions, and metadata\n- All tone instructions and style descriptions\n\nEverything must be written in ${languageName}, NOT English. Use natural, conversational ${languageName} appropriate for the target audience. Do NOT mix languages - use ${languageName} throughout.\n\n`

    // Insert language instruction right after the role description (after first paragraph)
    const firstParagraphEnd = enhancedPrompt.indexOf('\n\n')
    if (firstParagraphEnd !== -1) {
      enhancedPrompt = enhancedPrompt.slice(0, firstParagraphEnd + 2) +
                       languageInstruction +
                       enhancedPrompt.slice(firstParagraphEnd + 2)
    } else {
      // If no paragraph break found, insert at the beginning after first line
      const firstLineEnd = enhancedPrompt.indexOf('\n')
      if (firstLineEnd !== -1) {
        enhancedPrompt = enhancedPrompt.slice(0, firstLineEnd + 1) +
                         languageInstruction +
                         enhancedPrompt.slice(firstLineEnd + 1)
      } else {
        // Fallback: prepend to the entire prompt
        enhancedPrompt = languageInstruction + enhancedPrompt
      }
    }
  }

  // Inject successful examples before the CRITICAL RULES section if provided
  if (successExamples) {
    // Find the CRITICAL RULES section and insert examples before it
    const criticalRulesIndex = enhancedPrompt.indexOf('CRITICAL RULES:')
    if (criticalRulesIndex !== -1) {
      enhancedPrompt = enhancedPrompt.slice(0, criticalRulesIndex) +
                       successExamples +
                       '\n' +
                       enhancedPrompt.slice(criticalRulesIndex)
    } else {
      // If no CRITICAL RULES section found, append to end
      enhancedPrompt += successExamples
    }
  }

  // Inject model guidance before the CRITICAL RULES section if provided
  if (modelGuidance) {
    // Find the CRITICAL RULES section and insert model guidance before it
    const criticalRulesIndex = enhancedPrompt.indexOf('CRITICAL RULES:')
    if (criticalRulesIndex !== -1) {
      enhancedPrompt = enhancedPrompt.slice(0, criticalRulesIndex) +
                       modelGuidance +
                       '\n' +
                       enhancedPrompt.slice(criticalRulesIndex)
    } else {
      // If no CRITICAL RULES section found, append to end
      enhancedPrompt += modelGuidance
    }
  }

  return enhancedPrompt
}

/**
 * Video generation configuration constants
 * Based on AFP UGC n8n workflow "Create Video" node
 */
export const VIDEO_GENERATION_CONFIG = {
  MODEL: 'sora-2-text-to-video',
  DEFAULT_ASPECT_RATIO: 'portrait',
  DEFAULT_QUALITY: 'hd',
  MAX_PROMPT_LENGTH: 1000,
  MAX_TITLE_LENGTH: 100,
} as const

export type QualityTier = 'standard' | 'premium'

export interface QualityTierConfig {
  resolution: '720p' | '1080p'
  fps: number
  modelPreference: 'standard' | 'premium'
  enhancedPrompts: boolean
  description: string
}

/**
 * Quality tier configurations for video generation
 * Defines the differences between Standard and Premium tiers
 */
export const QUALITY_TIERS: Record<QualityTier, QualityTierConfig> = {
  standard: {
    resolution: '720p',
    fps: 30,
    modelPreference: 'standard',
    enhancedPrompts: false, // Standard users get basic prompts only
    description: 'Fast, cost-effective generation with good quality'
  },
  premium: {
    resolution: '1080p',
    fps: 60,
    modelPreference: 'premium',
    enhancedPrompts: true, // Premium users get enhanced prompts with negative prompts and quality instructions
    description: 'High-quality, cinematic generation with enhanced AI instructions'
  }
} as const

export interface VideoGenerationParams {
  prompt: string
  imageUrls: string[]
  aspectRatio?: string
  quality?: string
  duration?: number
  riskLevel?: QualityRiskLevel
  qualityTier?: QualityTier
}

/**
 * Generates the video generation request payload for Kie.ai API
 * Supports both regular models and Sora 2 Pro Storyboard API
 * @param params - Video generation parameters
 * @returns Request payload for Kie.ai API
 */
export function generateVideoGenerationPayload(
  params: VideoGenerationParams & { model?: string; scenes?: string[] }
): any {
  const {
    prompt,
    imageUrls,
    aspectRatio = VIDEO_GENERATION_CONFIG.DEFAULT_ASPECT_RATIO,
    quality = VIDEO_GENERATION_CONFIG.DEFAULT_QUALITY,
    duration, // Duration in seconds
    model = VIDEO_GENERATION_CONFIG.MODEL, // Default fallback to Sora 2
    scenes, // Array of scene descriptions for storyboard API
    riskLevel = 'low', // Default to low risk if not provided
    qualityTier = 'standard' // Default to standard tier if not provided
  } = params

  // Enhance prompt with quality instructions based on risk level
  const enhancedPrompt = enhancePromptWithQualityInstructions(prompt, riskLevel)

  // Get model-specific quality configuration
  const modelConfig = MODEL_QUALITY_CONFIGS[model]

  // Merge global negative prompts with model-specific ones
  const allNegativePrompts = modelConfig
    ? [...new Set([...NEGATIVE_PROMPTS, ...modelConfig.negativePrompt])]
    : NEGATIVE_PROMPTS

  // Create negative prompts string for appending to main prompt
  // Since not all models support negative_prompt field, we append to main prompt
  const negativePromptString = ` Avoid ${allNegativePrompts.join(', ')}.`

  // Add model-specific quality instructions if available
  const modelInstructions = modelConfig?.qualityInstructions
    ? ` ${modelConfig.qualityInstructions}.`
    : ''

  const finalPrompt = enhancedPrompt + modelInstructions + negativePromptString

  // Handle Sora 2 Pro Storyboard API (different structure)
  if (model === 'sora-2-pro-storyboard' && scenes && scenes.length > 0) {
    // Validate scenes array
    if (scenes.length === 0) {
      throw new Error('Storyboard API requires at least one scene')
    }

    // Transform scenes array into proper API format
    const shots = scenes.map((scene, index) => {
      // Extract duration from time range (e.g., "0-5s: Scene description" -> 5 seconds)
      const timeMatch = scene.match(/^(\d+)-(\d+)s:/)
      const duration = timeMatch ? parseInt(timeMatch[2]) - parseInt(timeMatch[1]) : 5

      // Validate duration
      if (duration <= 0) {
        throw new Error(`Invalid scene duration for scene ${index + 1}: ${duration}s`)
      }

      // Extract scene description (remove time range and audio part)
      const sceneDesc = scene
        .replace(/^\d+-\d+s:\s*/, '') // Remove time range prefix
        .replace(/\n\[Audio\].*$/, '') // Remove audio part suffix
        .trim()

      if (!sceneDesc) {
        throw new Error(`Empty scene description for scene ${index + 1}`)
      }

      return {
        Scene: sceneDesc,
        duration: duration
      }
    })

    // Validate total duration matches expected duration
    const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0)
    const expectedDuration = duration || 25
    if (totalDuration !== expectedDuration) {
      console.warn(`[Storyboard API] Scene durations (${totalDuration}s) don't match expected duration (${expectedDuration}s)`)
    }

    return {
      model, // Required: specify the storyboard model ('sora-2-pro-storyboard')
      callBackUrl: process.env.KIE_CALLBACK_URL || 'https://your-domain.com/api/callback', // Optional callback URL - verify if still supported
      input: {
        n_frames: String(expectedDuration), // Total video duration as string
        image_urls: imageUrls,
        aspect_ratio: aspectRatio,
        shots: shots // Array of scene objects with Scene and duration properties
      }
    }
  }

  // Get quality configuration for the tier
  const qualityConfig = QUALITY_TIERS[qualityTier]

  // Handle regular models with standard structure
  const payload: any = {
    model,
    input: {
      prompt: finalPrompt,
      image_urls: imageUrls,
      aspect_ratio: aspectRatio,
      quality: quality,
      resolution: qualityConfig.resolution,
      fps: qualityConfig.fps,
      ...(duration && { duration })
    }
  }

  // Only add callback URL if explicitly configured (for backward compatibility)
  if (process.env.KIE_CALLBACK_URL) {
    payload.callBackUrl = process.env.KIE_CALLBACK_URL
  }

  return payload
}
