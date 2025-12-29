/**
 * Template System Prompts Registry
 *
 * This document contains the definitive System Prompts for the "Advanced Creative Control" feature (Epic 8).
 * These prompts are optimized for GPT-4o and designed to output structured JSON for the frontend to render.
 */

import { getLanguageName } from './languages'
import { MODEL_QUALITY_CONFIGS, KieModel, KIE_MODELS } from './kie-models'
import { QualityRiskLevel } from './quality-analysis'
import { getModelPromptByKey } from './db/model-prompts'

/**
 * Strict JSON Schema for script generation to comply with OpenAI Structured Outputs.
 * All properties defined in each level must be included in the required array.
 * additionalProperties must be false at every level.
 */
export const SCRIPT_GENERATION_SCHEMA = {
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
      description: "Array of visual cue descriptions with timestamps"
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
    technical_directives: {
      type: "object",
      description: "Technical production directives including lighting, camera work, and consistency requirements",
      properties: {
        lighting: {
          type: "string",
          description: "Lighting setup and style recommendations"
        },
        camera: {
          type: "string",
          description: "Camera movement and shot composition guidelines"
        },
        consistency: {
          type: "string",
          description: "Consistency requirements across scenes"
        }
      },
      required: ["lighting", "camera", "consistency"],
      additionalProperties: false
    }
  },
  required: [
    "style",
    "tone_instructions",
    "visual_cues",
    "voiceover",
    "text_overlay",
    "music_recommendation",
    "hashtags",
    "technical_directives"
  ],
  additionalProperties: false
} as const

/**
 * Generate model-specific prompt enhancements including negative prompts and quality instructions
 *
 * @param model - KieModel instance
 * @param formatKey - Format key (e.g., 'ugc_auth_15s')
 * @returns Model-specific prompt enhancement string
 */
export function generateModelSpecificEnhancements(model: KieModel, formatKey: string): string {
  const modelConfig = MODEL_QUALITY_CONFIGS[model.id]

  if (!modelConfig) {
    // Fallback for models without specific config
    return `\n\nModel Requirements: Use ${model.name} for optimal results.`
  }

  // Build quality instructions section (keeping this for script guidance)
  // Note: Negative prompts are NOT included here - they're only for video generation
  const qualityInstructionsSection = modelConfig.qualityInstructions
    ? `\n• Quality Focus: ${modelConfig.qualityInstructions}`
    : ''

  // Build capability focus based on format
  const capabilityFocus = getCapabilityFocusForFormat(formatKey, model.id)

  // Build duration constraint
  const durationConstraint = `\n• Duration Limit: Keep total content within ${model.maxDuration} seconds`

  const enhancement = `
MODEL-SPECIFIC REQUIREMENTS FOR ${model.name.toUpperCase()}:${durationConstraint}${capabilityFocus}${qualityInstructionsSection}

INTEGRATE THESE REQUIREMENTS NATURALLY INTO YOUR SCRIPT DESIGN.`

  return enhancement
}

/**
 * Get format-specific capability focus for a given model
 *
 * @param formatKey - Format key (e.g., 'ugc_auth_15s')
 * @param modelId - Model ID
 * @returns Capability focus string
 */
function getCapabilityFocusForFormat(formatKey: string, modelId: string): string {
  const formatCapabilities: Record<string, Record<string, string>> = {
    // UGC Auth formats - Conversational, authentic content
    'ugc_auth_10s': {
      'sora-2-text-to-video': '\n• Leverage OpenAI Sora\'s natural conversational style and high fidelity',
      'kling-2.6': '\n• Optimize for Kling\'s authentic lip-sync and AI avatar dialogue delivery',
      'wan-2.6': '\n• Focus on Wan\'s genuine storytelling flow and multi-scene capabilities',
      'default': '\n• Emphasize authentic, conversational delivery with natural speech patterns'
    },
    'ugc_auth_15s': {
      'sora-2-text-to-video': '\n• Leverage OpenAI Sora\'s professional quality for authentic conversations',
      'kling-2.6': '\n• Optimize for Kling\'s lip-sync precision and dialogue authenticity',
      'wan-2.6': '\n• Use Wan\'s storytelling capabilities for extended authentic narratives',
      'default': '\n• Emphasize authentic, conversational delivery with professional quality'
    },

    // Green Screen React formats - Energetic reactions
    'green_screen_10s': {
      'kling-2.6': '\n• Maximize Kling\'s lip-sync precision for reaction delivery and dialogue',
      'wan-2.6': '\n• Use Wan\'s multi-scene capabilities for dynamic reaction sequences',
      'veo-3.1-fast': '\n• Capture Google Veo\'s authentic emotional reactions and expressions',
      'default': '\n• Focus on energetic, shocked reactions with precise timing and expressions'
    },
    'green_screen_15s': {
      'kling-2.6': '\n• Maximize Kling\'s lip-sync precision for extended reaction delivery',
      'wan-2.6': '\n• Use Wan\'s multi-scene capabilities for longer reaction sequences',
      'veo-3.1-fast': '\n• Leverage Google Veo\'s fast, high-quality reaction captures',
      'default': '\n• Focus on energetic, shocked reactions with professional timing'
    },

    // PAS Framework formats - Problem-solution narratives
    'pas_framework_10s': {
      'wan-2.6': '\n• Excel at Wan\'s problem-solution narrative structure and transitions',
      'veo-3.1-quality': '\n• Use Google Veo\'s premium quality for transformation reveals',
      'sora-2-text-to-video': '\n• Leverage Sora\'s natural storytelling for problem-solution flow',
      'default': '\n• Structure content with clear problem-agitate-solution flow and smooth transitions'
    },
    'pas_framework_15s': {
      'wan-2.6': '\n• Excel at Wan\'s extended problem-solution narrative capabilities',
      'veo-3.1-quality': '\n• Use Google Veo\'s cinematic quality for compelling transformations',
      'sora-2-pro': '\n• Leverage Sora Pro\'s cinematic storytelling for narrative arcs',
      'default': '\n• Structure content with clear problem-agitate-solution flow and professional quality'
    },

    // ASMR Visual formats - Smooth, satisfying motion
    'asmr_visual_10s': {
      'hailuo-2.3': '\n• Optimize Hailuo\'s smooth, artistic motion sequences and visual clarity',
      'wan-2.6': '\n• Create Wan\'s hypnotic visual flow and consistent quality',
      'default': '\n• Focus on smooth, satisfying visual sequences with artistic motion'
    },
    'asmr_visual_15s': {
      'hailuo-2.3': '\n• Optimize Hailuo\'s extended smooth motion sequences and artistic styles',
      'wan-2.6': '\n• Create Wan\'s hypnotic multi-scene visual flow',
      'default': '\n• Focus on smooth, satisfying visual sequences with professional motion'
    },

    // Before/After formats - Transformation content
    'before_after_15s': {
      'wan-2.6': '\n• Perfect for Wan\'s transformation narratives and multi-scene capabilities',
      'veo-3.1-quality': '\n• Ensure Google Veo\'s premium consistent quality across before/after shots',
      'sora-2-text-to-video': '\n• Leverage Sora\'s high fidelity for clear transformation comparisons',
      'default': '\n• Maintain identical angles and lighting for comparison shots with premium quality'
    },

    // Storyboard format - Long-form cinematic content
    'storyboard_25s': {
      'sora-2-pro': '\n• Leverage Sora Pro\'s cinematic storytelling and storyboard capabilities',
      'wan-2.6': '\n• Use Wan\'s multi-scene narrative structure for extended content',
      'default': '\n• Create detailed 5-scene cinematic narrative with professional transitions'
    }
  }

  const formatConfig = formatCapabilities[formatKey]
  if (formatConfig) {
    return formatConfig[modelId] || formatConfig['default'] || ''
  }

  return ''
}

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

Style guidelines: Conversational and authentic - use contractions, natural speech patterns, and first-person perspective. Use "I", "like", "honestly", contractions. No corporate language. Include personal struggle or story. First-person only. Total words: 35-40 maximum.`,

  ugc_auth_10s: `You are an expert UGC script writer for ultra-short 10-second viral videos. Stop the scroll with immediate value.

Style guidelines: Urgent and excited - fast-paced delivery, no fluff. Total words: 20-25 maximum. Immediate value, no setup. Fast-paced, urgent tone.`,

  green_screen_15s: `You are an expert in Green Screen React videos. Create excitement by reacting to on-screen content with authentic shock.

Style guidelines: Energetic, shocked, breathless - use 'NO WAY', 'WAIT', 'LOOK AT THIS'. Start with reaction words (NO WAY, WHAT, INSANE). Include specific numbers (price, reviews). Create urgency and FOMO. Total words: 35-40 maximum.`,

  green_screen_10s: `You are an expert in ultra-short Green Screen React videos. Create panic-buying urgency.

Style guidelines: Manic, hyper-fast, breathless - high energy. Use 'RUN', 'GONE', 'INSANE'. Focus on most shocking feature. Total words: 20-25 maximum.`,

  pas_framework_15s: `You are an expert in Problem-Agitate-Solution (PAS) video scripts. Show the problem, amplify frustration, present solution.

Style guidelines: Start frustrated, escalate exasperation, shift to relieved - empathetic throughout. Problem must be relatable. Benefits over features. Include social proof. CTA addresses objections. Total words: 35-40 maximum.`,

  pas_framework_10s: `You are an expert in ultra-short PAS scripts. Show immediate contrast: problem to solution.

Style guidelines: Sharp, punchy, authoritative - no pauses. Before vs After logic. 2 sentences maximum. Total words: 20-25 maximum.`,

  asmr_visual_15s: `You are an expert in satisfying ASMR visual content. Create hypnotic, scroll-stopping videos with satisfying sounds.

Style guidelines: Calm, soothing, minimalist - whisper quiet or no voiceover preferred. ASMR sounds are the star. First 2s shows satisfying action. Slow, deliberate pacing. Hypnotic enough viewer can't scroll. Total words: 20-25 maximum (or zero for no voiceover).`,

  asmr_visual_10s: `You are an expert in 10-second oddly satisfying visual loops. Pure zen in 10 seconds.

Style guidelines: Silent - let visuals speak, ASMR sounds only. ZERO words spoken. Focus on visual satisfaction. Simple text CTA at end.`,

  before_after_15s: `You are an expert in transformation videos. Use powerful visual contrast to prove results.

Style guidelines: Start empathetic, shift to excited at reveal - authentic testimonial style. Same lighting/angle for before/after. Realistic timeline. After reveal at 5-8 seconds. Include credibility element. Total words: 35-40 maximum.`,

  before_after_10s: `You are an expert in 10-second before/after reveals. Show results instantly.

Style guidelines: Shocked, impressed, concise - just facts. Rely on visual contrast. Immediate CTA. Total words: 20-25 maximum.`,

  storyboard_25s: `You are an expert in cinematic 25-second storyboard videos. Create 5-scene narrative arcs with visual consistency.

Style guidelines: Cinematic, narrative-driven - maintain visual consistency across scenes. 5 scenes of exactly 5 seconds each. Same character/setting for consistency. Use professional camera terms. Clear narrative arc. Every shot advances story.`,
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
 * Gets a system prompt by key from database with fallback to hardcoded prompts
 * @param key - The prompt key to lookup (e.g., 'ugc_auth_15s')
 * @returns The system prompt string
 */
export async function getSystemPrompt(key: string): Promise<string> {
  try {
    // Try to get prompt from database first
    const dbPrompt = await getModelPromptByKey(key)
    if (dbPrompt) {
      console.log(`[Prompts] Using database prompt for ${key}`)
      return dbPrompt.system_prompt
    }
  } catch (error) {
    console.warn(`[Prompts] Database query failed for ${key}, falling back to hardcoded:`, error)
  }

  // Fallback to hardcoded prompts
  console.log(`[Prompts] Using hardcoded prompt for ${key}`)
  const prompt = PROMPTS[key as PromptKey]
  if (!prompt) {
    console.warn(`Prompt key '${key}' not found, falling back to ugc_auth_15s`)
    return PROMPTS.ugc_auth_15s
  }
  return prompt
}

/**
 * Synchronous version of getSystemPrompt for backward compatibility
 * @param key - The prompt key to lookup
 * @returns The system prompt string
 * @deprecated Use the async getSystemPrompt function instead
 */
export function getSystemPromptSync(key: string): string {
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
  modelGuidance?: string,
  model?: KieModel,
  formatKey?: string
): string {
  // Product name/description are now only in user prompt, not system prompt
  // No need to replace placeholders here anymore
  let enhancedPrompt = prompt

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

  // Inject model-specific enhancements including negative prompts
  if (model && formatKey) {
    const modelEnhancements = generateModelSpecificEnhancements(model, formatKey)

    // Find the CRITICAL RULES section and insert model enhancements before it
    const criticalRulesIndex = enhancedPrompt.indexOf('CRITICAL RULES:')
    if (criticalRulesIndex !== -1) {
      enhancedPrompt = enhancedPrompt.slice(0, criticalRulesIndex) +
                       modelEnhancements +
                       '\n' +
                       enhancedPrompt.slice(criticalRulesIndex)
    } else {
      // If no CRITICAL RULES section found, append to end
      enhancedPrompt += modelEnhancements
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
 * Model-specific duration parameter configuration
 * Based on official Kie.ai API documentation for each model
 * 
 * Maps each model's kieApiModelName to:
 * - parameterName: The API parameter name (e.g., 'duration', 'n_frames')
 * - format: How to format the value ('string' or 'number')
 * - required: Whether the parameter is required
 */
const MODEL_DURATION_CONFIG: Record<string, {
  parameterName: string
  format: 'string' | 'number'
  required: boolean
}> = {
  // Sora 2 Pro Storyboard - uses n_frames instead of duration
  'sora-2-pro-storyboard': {
    parameterName: 'n_frames',
    format: 'string',
    required: true
  },
  // Wan models - duration as string
  'wan/2-6-text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'wan/2-2-a14b-text-to-video-turbo': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'wan/2-2-text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'wan/2-2-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'wan/2-6-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Kling models - duration as string
  'kling/v2-1-master-text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'kling/v2-1-standard': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'kling/v2-1-master-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Bytedance models - duration as string
  'bytedance/v1-lite-text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'bytedance/v1-lite-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'bytedance/v1-pro-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Hailuo models - duration as string
  'hailuo/02-text-to-video-pro': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'hailuo/02-text-to-video-standard': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'hailuo/02-image-to-video-pro': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Runway models - duration as string
  'runway-duration-5-generate': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Sora 2 models - duration as string (if supported)
  'sora-2-pro-text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'sora-2-pro-image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Grok models - duration format not documented, default to string
  'grok-imagine/text-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'grok-imagine/image-to-video': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Seedance - duration format not documented, default to string
  'seedance-pro-fast': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  // Veo3.1 models - duration format not documented in unified API
  // Default to string format for safety
  'veo3_fast': {
    parameterName: 'duration',
    format: 'string',
    required: false
  },
  'veo3': {
    parameterName: 'duration',
    format: 'string',
    required: false
  }
}

/**
 * Get duration parameter configuration for a specific model
 * @param model - The Kie.ai API model name (e.g., 'wan/2-6-text-to-video')
 * @returns Duration configuration or null if model doesn't support duration
 */
function getModelDurationConfig(model: string): {
  parameterName: string
  format: 'string' | 'number'
  required: boolean
} | null {
  return MODEL_DURATION_CONFIG[model] || null
}

/**
 * Format duration value according to model requirements
 * @param model - The Kie.ai API model name
 * @param duration - Duration in seconds (number)
 * @returns Formatted duration value or null if model doesn't support duration
 */
function formatDurationForModel(model: string, duration?: number): { [key: string]: string | number } | null {
  if (duration === undefined || duration === null) {
    return null
  }

  const config = getModelDurationConfig(model)
  
  // If model has specific config, use it
  if (config) {
    const value = config.format === 'string' ? String(duration) : duration
    return { [config.parameterName]: value }
  }

  // Default: most models use 'duration' as string
  // This is a safe fallback based on the error we encountered
  return { duration: String(duration) }
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

  // Get model configuration to check image URL limits
  // First try to find model by kieApiModelName, then by model ID
  let modelInfo: KieModel | undefined = undefined
  for (const [key, value] of Object.entries(KIE_MODELS)) {
    if (value.kieApiModelName === model || value.id === model) {
      modelInfo = value
      break
    }
  }

  // Get max image URLs and field name from model config
  const maxImageUrls = modelInfo?.maxImageUrls ?? 1 // Default to 1 if not specified
  const imageUrlFieldName = modelInfo?.imageUrlFieldName ?? 'image_url' // Default to singular

  // Validate and limit image URLs based on model constraints
  if (imageUrls.length > maxImageUrls) {
    console.warn(
      `[Image URL Limit] Model ${model} only accepts ${maxImageUrls} image URL(s), but ${imageUrls.length} provided. Limiting to first ${maxImageUrls}.`
    )
  }
  const limitedImageUrls = imageUrls.slice(0, maxImageUrls)

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
        duration: String(duration)
      }
    })

    // Validate total duration matches expected duration
    const totalDuration = shots.reduce((sum, shot) => sum + parseInt(String(shot.duration), 10), 0)
    const expectedDuration = duration || 25
    if (totalDuration !== expectedDuration) {
      console.warn(`[Storyboard API] Scene durations (${totalDuration}s) don't match expected duration (${expectedDuration}s)`)
    }

    // Storyboard API uses image_urls (plural) - validate limit
    const storyboardImageUrls = limitedImageUrls.length > 10 ? limitedImageUrls.slice(0, 10) : limitedImageUrls

    return {
      model, // Required: specify the storyboard model ('sora-2-pro-storyboard')
      callBackUrl: process.env.KIE_CALLBACK_URL || 'https://your-domain.com/api/callback', // Optional callback URL - verify if still supported
      input: {
        n_frames: String(expectedDuration), // Total video duration as string
        image_urls: storyboardImageUrls,
        aspect_ratio: aspectRatio,
        shots: shots // Array of scene objects with Scene and duration properties
      }
    }
  }

  // Get quality configuration for the tier
  const qualityConfig = QUALITY_TIERS[qualityTier]

  // Format duration according to model-specific requirements
  const durationParams = formatDurationForModel(model, duration)

  // Build input object with correct image URL field name
  const input: any = {
    prompt: finalPrompt,
    aspect_ratio: aspectRatio,
    quality: quality,
    resolution: qualityConfig.resolution,
    fps: qualityConfig.fps,
    ...(durationParams || {})
  }

  // Use the correct field name based on model (image_url vs image_urls)
  if (imageUrlFieldName === 'image_url') {
    // Models that use singular image_url - only use first image
    if (limitedImageUrls.length > 0) {
      input.image_url = limitedImageUrls[0]
    }
  } else {
    // Models that use plural image_urls - use array
    input.image_urls = limitedImageUrls
  }

  // Handle regular models with standard structure
  const payload: any = {
    model,
    input
  }

  // Only add callback URL if explicitly configured (for backward compatibility)
  if (process.env.KIE_CALLBACK_URL) {
    payload.callBackUrl = process.env.KIE_CALLBACK_URL
  }

  return payload
}
