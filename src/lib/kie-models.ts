/**
 * Kie.ai Model Selection and Cost Calculation
 * 
 * Based on comprehensive research analysis of Kie.ai video generation models
 * for UGC (User-Generated Content) video creation.
 * 
 * Provides format-based model selection, cost calculation, and fallback logic.
 */

export interface KieModel {
  id: string
  name: string
  maxDuration: number // seconds
  pricing: {
    perSecond: number // USD per second
    creditsPerSecond?: number // Alternative: credits per second
  }
  capabilities: string[]
  bestFor: string[]
  kieApiModelName: string // Actual model name for Kie.ai API
}

/**
 * Model registry based on official Kie.ai documentation
 * Pricing verified against Kie.ai API (as of December 2024)
 * Last verified: December 29, 2025
 *
 * IMPORTANT: Monitor Kie.ai pricing updates quarterly
 * Consider implementing automated price fetching from Kie.ai API if available
 */
export const KIE_MODELS: Record<string, KieModel> = {
  'veo-3.1-fast': {
    id: 'veo-3.1-fast',
    name: 'Veo 3.1 Fast',
    maxDuration: 8,
    pricing: { perSecond: 0.05 }, // $0.40 for 8s
    capabilities: ['text-to-video', 'realistic', 'expressions', 'fast'],
    bestFor: ['reactions', 'emotional-content', 'fast-generation'],
    kieApiModelName: 'veo3_fast'
  },
  'veo-3.1-quality': {
    id: 'veo-3.1-quality',
    name: 'Veo 3.1 Quality',
    maxDuration: 8,
    pricing: { perSecond: 0.25 }, // $2.00 for 8s
    capabilities: ['text-to-video', 'premium-quality', 'cinematic', 'high-fidelity'],
    bestFor: ['premium-content', 'transformations', 'professional'],
    kieApiModelName: 'veo3'
  },
  'runway-gen-4-turbo': {
    id: 'runway-gen-4-turbo',
    name: 'Runway Gen-4 Turbo',
    maxDuration: 10,
    pricing: { perSecond: 0.025 }, // $0.25 for 10s
    capabilities: ['image-to-video', 'fast-generation', 'iterative', 'text-to-video'],
    bestFor: ['rapid-prototyping', 'visual-content', 'iterative-work'],
    kieApiModelName: 'runway-duration-5-generate' // Supports 5-10s durations
  },
  'wan-2.2-turbo': {
    id: 'wan-2.2-turbo',
    name: 'Wan 2.2 Turbo',
    maxDuration: 10,
    pricing: { perSecond: 0.1 }, // High-speed turbo pricing
    capabilities: ['text-to-video', 'image-to-video', 'turbo', 'fast'],
    bestFor: ['high-speed', 'prototyping', 'cost-effective'],
    kieApiModelName: 'wan/2-2-a14b-text-to-video-turbo'
  },
  'wan-2.6': {
    id: 'wan-2.6',
    name: 'Wan 2.6',
    maxDuration: 15,
    pricing: { perSecond: 0.07 }, // $1.05 for 15s
    capabilities: ['text-to-video', 'image-to-video', 'multi-shot', 'storytelling'],
    bestFor: ['storytelling', 'narrative', 'multi-scene', 'extended-content'],
    kieApiModelName: 'wan/2-6-text-to-video'
  },
  'kling-2.1-master': {
    id: 'kling-2.1-master',
    name: 'Kling 2.1 Master',
    maxDuration: 10,
    pricing: { perSecond: 0.11 }, // $1.10 for 10s with audio
    capabilities: ['text-to-video', 'image-to-video', 'lip-sync', 'dialogue', 'high-quality'],
    bestFor: ['dialogue', 'testimonials', 'professional', 'lip-sync'],
    kieApiModelName: 'kling/v2-1-master-text-to-video'
  },
  'kling-2.6': {
    id: 'kling-2.6',
    name: 'Kling 2.6',
    maxDuration: 10,
    pricing: { perSecond: 0.11 }, // $1.10 for 10s with audio
    capabilities: ['text-to-video', 'lip-sync', 'native-audio', 'dialogue', 'avatar'],
    bestFor: ['dialogue', 'testimonials', 'authentic-conversation', 'avatar'],
    kieApiModelName: 'kling/v2-1-standard' // Using most recent available
  },
  'sora-2-text-to-video': {
    id: 'sora-2-text-to-video',
    name: 'Sora 2 Text-to-Video',
    maxDuration: 10,
    pricing: { perSecond: 0.015 }, // $0.015/s
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync', 'high-quality'],
    bestFor: ['conversational', 'authentic', 'cost-effective', 'professional'],
    kieApiModelName: 'sora-2-pro-text-to-video'
  },
  'sora-2-pro': {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro Storyboard',
    maxDuration: 25,
    pricing: { perSecond: 0.04 }, // $1.00 for 25s
    capabilities: ['storyboard', 'long-form', 'cinematic', 'narrative', 'multi-scene'],
    bestFor: ['narrative-ads', 'mini-docs', 'tutorials', 'storytelling', 'cinematic'],
    kieApiModelName: 'sora-2-pro-storyboard'
  },
  'hailuo-2.3': {
    id: 'hailuo-2.3',
    name: 'Hailuo 2.3 Pro',
    maxDuration: 10,
    pricing: { perSecond: 0.045 }, // $0.45 for 10s
    capabilities: ['text-to-video', 'smooth-motion', 'visual-quality', 'artistic'],
    bestFor: ['asmr-visual', 'smooth-demos', 'artistic', 'cost-effective'],
    kieApiModelName: 'hailuo/02-text-to-video-pro'
  },
  'bytedance-v1-lite': {
    id: 'bytedance-v1-lite',
    name: 'Bytedance v1 Lite',
    maxDuration: 5,
    pricing: { perSecond: 0.1 }, // Fast, cost-effective
    capabilities: ['text-to-video', 'image-to-video', 'fast', 'lite'],
    bestFor: ['fast-generation', 'prototyping', 'social-media', 'cost-effective'],
    kieApiModelName: 'bytedance/v1-lite-text-to-video'
  },
  'seedance-pro': {
    id: 'seedance-pro',
    name: 'Seedance Pro Fast',
    maxDuration: 10,
    pricing: { perSecond: 0.018 }, // $0.18 for 10s
    capabilities: ['text-to-video', 'viral-aesthetic', 'dynamic', 'fast'],
    bestFor: ['viral-content', 'social-media', 'fast-generation', 'trending'],
    kieApiModelName: 'seedance-pro-fast'
  },
  'grok-imagine-video': {
    id: 'grok-imagine-video',
    name: 'Grok Imagine Video',
    maxDuration: 10,
    pricing: { perSecond: 0.05 }, // Creative pricing
    capabilities: ['text-to-video', 'image-to-video', 'creative', 'motion'],
    bestFor: ['creative', 'experimental', 'motion-graphics', 'unique'],
    kieApiModelName: 'grok-imagine/text-to-video'
  }
}

/**
 * Format to model mapping based on research recommendations
 * Maps UGC format (style_duration) to optimal model selection
 */
export const FORMAT_MODEL_MAPPING: Record<string, { primary: string; backup: string }> = {
  // 10-second formats - Optimized for speed, quality, and cost-effectiveness
  'ugc_auth_10s': { primary: 'sora-2-text-to-video', backup: 'kling-2.6' }, // Sora for authentic, Kling for dialogue
  'green_screen_10s': { primary: 'kling-2.6', backup: 'veo-3.1-fast' }, // Kling for lip-sync, Veo for reactions
  'pas_framework_10s': { primary: 'wan-2.6', backup: 'sora-2-text-to-video' }, // Wan for narrative, Sora for fallback
  'asmr_visual_10s': { primary: 'hailuo-2.3', backup: 'wan-2.6' }, // Hailuo for smooth motion, Wan for consistency

  // 15-second formats - Balanced quality and duration
  'ugc_auth_15s': { primary: 'sora-2-text-to-video', backup: 'wan-2.6' }, // Sora for authentic content
  'green_screen_15s': { primary: 'kling-2.6', backup: 'wan-2.6' }, // Kling for dialogue, Wan for longer format
  'pas_framework_15s': { primary: 'wan-2.6', backup: 'sora-2-pro' }, // Wan for storytelling, Sora Pro for cinematic
  'asmr_visual_15s': { primary: 'hailuo-2.3', backup: 'wan-2.6' }, // Hailuo for smooth motion
  'before_after_15s': { primary: 'veo-3.1-quality', backup: 'wan-2.6' }, // Veo for premium transformations

  // 25-second formats - Premium quality for long-form
  'storyboard_25s': { primary: 'sora-2-pro', backup: 'wan-2.6' } // Sora Pro specifically for storyboards
}

/**
 * Calculate format key from style and duration
 * Normalizes style names to match format mapping keys
 * 
 * @param style - Video style (e.g., 'ugc', 'green_screen', 'pas_framework')
 * @param duration - Video duration ('10s' or '15s')
 * @returns Format key (e.g., 'ugc_auth_10s')
 */
export function getFormatKey(style: string, duration: string): string {
  // Normalize style names
  const styleMap: Record<string, string> = {
    'ugc': 'ugc_auth',
    'ugc_auth': 'ugc_auth',
    'green_screen': 'green_screen',
    'pas_framework': 'pas_framework',
    'pas': 'pas_framework',
    'asmr_visual': 'asmr_visual',
    'asmr': 'asmr_visual',
    'before_after': 'before_after',
    'storyboard': 'storyboard'
  }
  
  const normalizedStyle = styleMap[style.toLowerCase()] || style.toLowerCase()
  const normalizedDuration = duration.toLowerCase()
  
  return `${normalizedStyle}_${normalizedDuration}`
}

/**
 * Select optimal model for a given format
 * 
 * @param format - Format key (e.g., 'ugc_auth_10s')
 * @returns Selected KieModel instance
 */
export function selectModelForFormat(format: string): KieModel {
  const mapping = FORMAT_MODEL_MAPPING[format]
  
  if (!mapping) {
    // Structured logging for monitoring format fallbacks
    console.warn('[Format Fallback]', {
      format,
      reason: 'format_not_in_mapping',
      fallback: 'sora2',
      timestamp: new Date().toISOString(),
      availableFormats: Object.keys(FORMAT_MODEL_MAPPING)
    })
    return KIE_MODELS.sora2
  }
  
  const model = KIE_MODELS[mapping.primary]
  
  if (!model) {
    // Structured logging for monitoring model fallbacks
    console.warn('[Model Fallback]', {
      format,
      primary: mapping.primary,
      backup: mapping.backup,
      reason: 'primary_model_not_found',
      timestamp: new Date().toISOString(),
      availableModels: Object.keys(KIE_MODELS)
    })
    const backupModel = KIE_MODELS[mapping.backup]
    return backupModel || KIE_MODELS.sora2
  }
  
  return model
}

/**
 * Calculate cost for video generation based on model and duration
 * Handles cases where duration exceeds model maxDuration (requires multiple generations)
 * 
 * @param model - Selected KieModel
 * @param duration - Target duration in seconds
 * @returns Cost in USD
 */
export function calculateVideoCost(model: KieModel, duration: number): number {
  // For durations exceeding model max, calculate cost for multiple generations
  if (duration > model.maxDuration) {
    const generationsNeeded = Math.ceil(duration / model.maxDuration)
    // Cost per generation = maxDuration * perSecond
    const costPerGeneration = model.pricing.perSecond * model.maxDuration
    return costPerGeneration * generationsNeeded
  }
  
  // Standard calculation: duration * perSecond
  return model.pricing.perSecond * duration
}

/**
 * Convert USD cost to credits
 * Kie.ai uses a credit system where 1 credit ≈ $0.005
 * 
 * @param usd - Cost in USD
 * @returns Cost in credits (rounded up)
 */
export function usdToCredits(usd: number): number {
  return Math.ceil(usd / 0.005)
}

/**
 * Get backup model for a format
 *
 * @param format - Format key
 * @returns Backup KieModel instance
 */
export function getBackupModelForFormat(format: string): KieModel {
  const mapping = FORMAT_MODEL_MAPPING[format]

  if (!mapping) {
    return KIE_MODELS.sora2
  }

  const backupModel = KIE_MODELS[mapping.backup]
  return backupModel || KIE_MODELS.sora2
}

/**
 * Quality risk level enum for model selection
 */
export type QualityRiskLevel = 'low' | 'medium' | 'high'

/**
 * Model-specific quality configurations for optimal prompt engineering
 * Each model has tailored negative prompts and quality instructions based on
 * its strengths, weaknesses, and typical failure modes.
 */
export const MODEL_QUALITY_CONFIGS: Record<string, {
  negativePrompt: string[]
  qualityInstructions: string
  recommendedFor: string[]
  avoidFor: string[]
}> = {
  // Google Veo3.1 Models
  'veo-3.1-fast': {
    negativePrompt: ['blurry', 'low quality', 'distorted', 'artifacts', 'motion blur', 'inconsistent expressions'],
    qualityInstructions: 'Professional-quality video, 1080P HD output, cinematic lighting, sharp focus, natural expressions, fluid motion',
    recommendedFor: ['reactions', 'emotional-content', 'fast-generation', 'marketing', 'social-media'],
    avoidFor: ['long-duration', 'complex-scenes', 'very-detailed-text', 'ultra-high-motion']
  },
  'veo-3.1-quality': {
    negativePrompt: ['artifacts', 'distortion', 'motion blur', 'low quality', 'inconsistent lighting', 'blurry', 'poor anatomy'],
    qualityInstructions: 'Cinematic quality, perfect anatomy, sharp focus, professional lighting, detailed textures, 1080P HD, premium finish',
    recommendedFor: ['premium-content', 'hands', 'text', 'high-fidelity', 'transformations', 'professional'],
    avoidFor: ['ultra-fast-generation', 'very-long-duration', 'experimental-styles']
  },

  // Runway Models
  'runway-gen-4-turbo': {
    negativePrompt: ['artifacts', 'inconsistent quality', 'motion blur', 'blurry', 'low quality'],
    qualityInstructions: 'High-quality image-to-video conversion, smooth transitions, consistent visual style, professional output',
    recommendedFor: ['rapid-prototyping', 'visual-content', 'iterative-work', 'advertising', 'creative-content'],
    avoidFor: ['long-duration', 'complex-motion', 'dialogue-heavy', 'ultra-realistic']
  },

  // Wan Models
  'wan-2.2-turbo': {
    negativePrompt: ['artifacts', 'motion blur', 'inconsistent quality', 'poor transitions', 'blurry', 'low quality'],
    qualityInstructions: 'Turbo performance, smooth motion, consistent quality, fast generation, reliable output',
    recommendedFor: ['high-speed', 'prototyping', 'cost-effective', 'quick-iterations'],
    avoidFor: ['premium-quality', 'ultra-detailed', 'cinematic-masterpieces']
  },
  'wan-2.6': {
    negativePrompt: ['artifacts', 'motion blur', 'inconsistent quality', 'poor transitions', 'blurry', 'low quality'],
    qualityInstructions: 'Advanced video generation, smooth multi-scene transitions, consistent visual quality, natural pacing, high fidelity',
    recommendedFor: ['storytelling', 'narrative', 'multi-scene', 'extended-content', 'advertising'],
    avoidFor: ['single-static-shots', 'ultra-fast-content', 'simple-talking-heads']
  },

  // Kling Models
  'kling-2.1-master': {
    negativePrompt: ['unnatural movements', 'blurry text', 'low quality', 'poor lip sync', 'artifacts', 'motion blur'],
    qualityInstructions: 'High-quality video, AI avatars, accurate lip sync, professional dialogue delivery, smooth motion',
    recommendedFor: ['dialogue', 'testimonials', 'professional', 'lip-sync', 'presentations'],
    avoidFor: ['static-scenes', 'complex-visuals', 'extreme-motion', 'experimental']
  },
  'kling-2.6': {
    negativePrompt: ['unnatural movements', 'blurry text', 'low quality', 'poor lip sync', 'artifacts', 'motion blur'],
    qualityInstructions: 'High-quality AI avatars, accurate lip sync, native audio, professional dialogue delivery, smooth motion',
    recommendedFor: ['dialogue', 'testimonials', 'authentic-conversation', 'avatar-content', 'professional'],
    avoidFor: ['static-scenes', 'complex-visuals', 'extreme-motion', 'abstract-content']
  },

  // Sora Models
  'sora-2-text-to-video': {
    negativePrompt: ['extra fingers', 'blurry text', 'low quality', 'distorted faces', 'artifacts', 'motion blur'],
    qualityInstructions: 'State-of-the-art video generation, high fidelity, sharp details, natural composition, professional quality',
    recommendedFor: ['conversational', 'authentic', 'professional', 'narrative', 'high-quality'],
    avoidFor: ['ultra-complex-scenes', 'experimental-styles', 'very-long-duration']
  },
  'sora-2-pro': {
    negativePrompt: ['artifacts', 'motion blur', 'inconsistent quality', 'poor transitions', 'blurry', 'low quality'],
    qualityInstructions: 'Cinematic storytelling, smooth scene transitions, professional narrative quality, long-form content, high production value',
    recommendedFor: ['narrative-ads', 'mini-docs', 'tutorials', 'storytelling', 'cinematic', 'long-form'],
    avoidFor: ['ultra-short-content', 'single-shots', 'rapid-cuts', 'experimental']
  },

  // Hailuo Models
  'hailuo-2.3': {
    negativePrompt: ['motion blur', 'low quality', 'artifacts', 'poor motion', 'blurry', 'inconsistent'],
    qualityInstructions: 'High-quality video, multiple artistic styles, smooth fluid motion, high visual clarity, consistent quality',
    recommendedFor: ['asmr-visual', 'smooth-demos', 'artistic', 'cost-effective', 'creative'],
    avoidFor: ['jerky-movement', 'static-content', 'complex-interactions', 'ultra-fast']
  },

  // Bytedance Models
  'bytedance-v1-lite': {
    negativePrompt: ['blurry', 'low quality', 'artifacts', 'motion blur', 'inconsistent', 'poor quality'],
    qualityInstructions: 'Fast efficient video generation, reliable output, good quality for social media, consistent results',
    recommendedFor: ['fast-generation', 'prototyping', 'social-media', 'cost-effective', 'marketing'],
    avoidFor: ['premium-quality', 'ultra-detailed', 'cinematic', 'long-duration']
  },

  // Seedance Models
  'seedance-pro': {
    negativePrompt: ['artifacts', 'motion blur', 'low quality', 'inconsistent style', 'blurry', 'poor quality'],
    qualityInstructions: 'Viral aesthetic, dynamic motion, consistent visual appeal, engaging movement, trending styles',
    recommendedFor: ['viral-content', 'social-media', 'fast-generation', 'trending', 'youth-culture'],
    avoidFor: ['premium-quality', 'complex-scenes', 'professional-content', 'formal']
  },

  // Grok Models
  'grok-imagine-video': {
    negativePrompt: ['blurry', 'low quality', 'artifacts', 'motion blur', 'inconsistent', 'poor quality'],
    qualityInstructions: 'Creative video generation, motion capabilities, experimental styles, unique approaches, engaging content',
    recommendedFor: ['creative', 'experimental', 'motion-graphics', 'unique', 'innovative'],
    avoidFor: ['ultra-realistic', 'professional', 'formal', 'traditional']
  }
}

/**
 * Select optimal model for a given format considering quality risk and user tier
 * High-risk content (hands, text) should trigger premium models regardless of tier
 *
 * @param format - Format key (e.g., 'ugc_auth_10s')
 * @param riskLevel - Quality risk level from content analysis
 * @param userTier - User's quality tier (standard/premium)
 * @returns Selected KieModel instance optimized for quality
 */
export function selectModelForQualityRisk(
  format: string,
  riskLevel: QualityRiskLevel,
  userTier: 'standard' | 'premium'
): KieModel {
  const formatMapping = FORMAT_MODEL_MAPPING[format]

  // High risk content → always use premium models for best quality
  if (riskLevel === 'high') {
    // Define premium models that excel at complex content
    const premiumModels = Object.values(KIE_MODELS).filter(model =>
      ['veo-3.1-quality', 'kling-2.6', 'wan-2.6', 'sora-2-pro'].includes(model.id)
    )

    // Find premium models that support the requested duration
    const duration = parseInt(format.split('_').pop()?.replace('s', '') || '15', 10)
    const suitablePremiumModels = premiumModels.filter(model =>
      model.maxDuration >= duration
    )

    if (suitablePremiumModels.length > 0) {
      // Sort by quality and cost-effectiveness for complex content
      // Kling 2.6 is great for dialogue, Veo 3.1 Quality for general high quality
      const modelPriority = ['veo-3.1-quality', 'kling-2.6', 'wan-2.6', 'sora-2-pro']
      const sortedModels = suitablePremiumModels.sort((a, b) => {
        const aIndex = modelPriority.indexOf(a.id)
        const bIndex = modelPriority.indexOf(b.id)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })

      console.log(`[Quality Risk] High-risk content (${format}) → selecting ${sortedModels[0].name} (${sortedModels[0].id})`)
      return sortedModels[0]
    }
  }

  // Medium risk content → upgrade if premium tier
  if (riskLevel === 'medium' && userTier === 'premium') {
    // For premium users with medium risk, use Veo 3.1 Quality for better results
    const duration = parseInt(format.split('_').pop()?.replace('s', '') || '15', 10)
    if (KIE_MODELS['veo-3.1-quality'].maxDuration >= duration) {
      console.log(`[Quality Risk] Medium-risk content (${format}) + Premium tier → selecting Veo 3.1 Quality`)
      return KIE_MODELS['veo-3.1-quality']
    }
  }

  // Low risk or standard tier → use format-based selection
  const selectedModel = selectModelForFormat(format)
  console.log(`[Quality Risk] ${riskLevel} risk + ${userTier} tier (${format}) → using format selection: ${selectedModel.name}`)
  return selectedModel
}

