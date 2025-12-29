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
  'sora2': {
    id: 'sora2',
    name: 'Sora 2',
    maxDuration: 10,
    pricing: { perSecond: 0.015 }, // Verified: $0.015/s (as of Dec 2024)
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync'],
    bestFor: ['conversational', 'authentic', 'cost-effective'],
    kieApiModelName: 'sora-2-text-to-video'
  },
  'kling-2.6': {
    id: 'kling-2.6',
    name: 'Kling 2.6',
    maxDuration: 10,
    pricing: { perSecond: 0.11 }, // Verified: $1.10 for 10s with audio (as of Dec 2024)
    capabilities: ['text-to-video', 'lip-sync', 'native-audio', 'dialogue'],
    bestFor: ['dialogue', 'testimonials', 'authentic-conversation'],
    kieApiModelName: 'kling-2-6-text-to-video'
  },
  'wan-2.6': {
    id: 'wan-2.6',
    name: 'Wan 2.6',
    maxDuration: 15,
    pricing: { perSecond: 0.07 }, // Verified: $1.05 for 15s (as of Dec 2024)
    capabilities: ['text-to-video', 'multi-shot', 'native-audio', 'storytelling'],
    bestFor: ['storytelling', 'narrative', 'multi-scene', 'extended-content'],
    kieApiModelName: 'wan-2-6-text-to-video'
  },
  'veo-3.1-fast': {
    id: 'veo-3.1-fast',
    name: 'Veo 3.1 Fast',
    maxDuration: 8,
    pricing: { perSecond: 0.05 }, // Verified: $0.40 for 8s (as of Dec 2024)
    capabilities: ['text-to-video', 'realistic', 'expressions'],
    bestFor: ['reactions', 'emotional-content', 'visual-quality'],
    kieApiModelName: 'veo-3-1-fast'
  },
  'veo-3.1-quality': {
    id: 'veo-3.1-quality',
    name: 'Veo 3.1 Quality',
    maxDuration: 8,
    pricing: { perSecond: 0.25 }, // Verified: $2.00 for 8s (as of Dec 2024)
    capabilities: ['text-to-video', 'premium-quality', 'cinematic'],
    bestFor: ['premium-content', 'high-fidelity', 'transformations'],
    kieApiModelName: 'veo-3-1-quality'
  },
  'hailuo-2.3': {
    id: 'hailuo-2.3',
    name: 'Hailuo 2.3 Pro',
    maxDuration: 10,
    pricing: { perSecond: 0.045 }, // Verified: $0.45 for 10s Pro (as of Dec 2024)
    capabilities: ['text-to-video', 'smooth-motion', 'visual-quality'],
    bestFor: ['asmr-visual', 'smooth-demos', 'cost-effective'],
    kieApiModelName: 'hailuo-2-3-text-to-video'
  },
  'runway-gen-4-turbo': {
    id: 'runway-gen-4-turbo',
    name: 'Runway Gen-4 Turbo',
    maxDuration: 10,
    pricing: { perSecond: 0.025 }, // Verified: $0.25 for 10s (as of Dec 2024)
    capabilities: ['image-to-video', 'fast-generation', 'iterative'],
    bestFor: ['rapid-prototyping', 'visual-content'],
    kieApiModelName: 'runway-gen-4-turbo'
  },
  'seedance-pro': {
    id: 'seedance-pro',
    name: 'Seedance Pro Fast',
    maxDuration: 10,
    pricing: { perSecond: 0.018 }, // Verified: $0.18 for 10s 720p (as of Dec 2024)
    capabilities: ['text-to-video', 'viral-aesthetic', 'dynamic'],
    bestFor: ['viral-content', 'social-media', 'fast-generation'],
    kieApiModelName: 'seedance-pro-fast'
  },
  'sora-2-pro': {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro Storyboard',
    maxDuration: 25, // Verified: Supports up to 25-second videos
    pricing: { perSecond: 0.04 }, // Verified: $1.00 for 25s ($0.04/s)
    capabilities: ['storyboard', 'long-form', 'cinematic', 'narrative'],
    bestFor: ['narrative-ads', 'mini-docs', 'tutorials', 'storytelling'],
    kieApiModelName: 'sora-2-pro-storyboard' // Verified: Correct API model name
  }
}

/**
 * Format to model mapping based on research recommendations
 * Maps UGC format (style_duration) to optimal model selection
 */
export const FORMAT_MODEL_MAPPING: Record<string, { primary: string; backup: string }> = {
  // 10-second formats
  'ugc_auth_10s': { primary: 'sora2', backup: 'kling-2.6' },
  'green_screen_10s': { primary: 'kling-2.6', backup: 'sora2' },
  'pas_framework_10s': { primary: 'wan-2.6', backup: 'sora2' },
  'asmr_visual_10s': { primary: 'wan-2.6', backup: 'sora2' },

  // 15-second formats
  'ugc_auth_15s': { primary: 'wan-2.6', backup: 'wan-2.6' },
  'green_screen_15s': { primary: 'wan-2.6', backup: 'sora2' },
  'pas_framework_15s': { primary: 'wan-2.6', backup: 'sora2' },
  'asmr_visual_15s': { primary: 'wan-2.6', backup: 'sora2' },
  'before_after_15s': { primary: 'wan-2.6', backup: 'sora2' },

  // 25-second formats
  'storyboard_25s': { primary: 'sora-2-pro', backup: 'wan-2.6' }
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
  'sora2': {
    negativePrompt: ['extra fingers', 'blurry text', 'low quality', 'distorted faces'],
    qualityInstructions: 'High fidelity, sharp details, natural composition',
    recommendedFor: ['conversational', 'authentic', 'cost-effective', 'simple scenes'],
    avoidFor: ['complex hands', 'detailed text', 'high motion']
  },
  'kling-2.6': {
    negativePrompt: ['unnatural movements', 'blurry text', 'low quality', 'poor lip sync'],
    qualityInstructions: 'Smooth motion, accurate lip sync, professional dialogue delivery',
    recommendedFor: ['dialogue', 'testimonials', 'talking heads', 'conversational'],
    avoidFor: ['static scenes', 'complex visuals', 'extreme motion']
  },
  'wan-2.6': {
    negativePrompt: ['artifacts', 'motion blur', 'inconsistent quality', 'poor transitions'],
    qualityInstructions: 'Smooth multi-scene transitions, consistent visual quality, natural pacing',
    recommendedFor: ['storytelling', 'narrative', 'multi-scene', 'extended content'],
    avoidFor: ['single static shots', 'ultra-fast content', 'simple talking heads']
  },
  'veo-3.1-fast': {
    negativePrompt: ['low quality', 'artifacts', 'motion blur', 'inconsistent expressions'],
    qualityInstructions: 'Sharp focus, natural expressions, fluid motion, high detail retention',
    recommendedFor: ['reactions', 'emotional content', 'fast generation', 'expressions'],
    avoidFor: ['long duration', 'complex scenes', 'detailed text']
  },
  'veo-3.1-quality': {
    negativePrompt: ['artifacts', 'distortion', 'motion blur', 'low quality', 'inconsistent lighting'],
    qualityInstructions: 'Cinematic quality, perfect anatomy, sharp focus, professional lighting, detailed textures',
    recommendedFor: ['premium content', 'hands', 'text', 'high fidelity', 'complex scenes'],
    avoidFor: ['ultra-fast generation', 'very long duration']
  },
  'hailuo-2.3': {
    negativePrompt: ['motion blur', 'low quality', 'artifacts', 'poor motion'],
    qualityInstructions: 'Smooth, fluid motion, high visual clarity, consistent quality',
    recommendedFor: ['asmr visual', 'smooth demos', 'cost-effective', 'motion-focused'],
    avoidFor: ['jerky movement', 'static content', 'complex interactions']
  },
  'runway-gen-4-turbo': {
    negativePrompt: ['artifacts', 'inconsistent quality', 'motion blur'],
    qualityInstructions: 'High-quality image-to-video conversion, smooth transitions, consistent visual style',
    recommendedFor: ['rapid prototyping', 'visual content', 'iterative work'],
    avoidFor: ['long duration', 'complex motion', 'dialogue']
  },
  'seedance-pro': {
    negativePrompt: ['artifacts', 'motion blur', 'low quality', 'inconsistent style'],
    qualityInstructions: 'Viral aesthetic, dynamic motion, consistent visual appeal, engaging movement',
    recommendedFor: ['viral content', 'social media', 'fast generation', 'trending styles'],
    avoidFor: ['premium quality', 'complex scenes', 'professional content']
  },
  'sora-2-pro': {
    negativePrompt: ['artifacts', 'motion blur', 'inconsistent quality', 'poor transitions'],
    qualityInstructions: 'Cinematic storytelling, smooth scene transitions, professional narrative quality',
    recommendedFor: ['narrative ads', 'mini-docs', 'tutorials', 'storytelling'],
    avoidFor: ['ultra-short content', 'single shots', 'rapid cuts']
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

