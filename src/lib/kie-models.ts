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
 * Model registry based on research findings
 * Pricing from Kie.ai (as of December 2024)
 */
export const KIE_MODELS: Record<string, KieModel> = {
  'sora2': {
    id: 'sora2',
    name: 'Sora 2',
    maxDuration: 10,
    pricing: { perSecond: 0.015 },
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync'],
    bestFor: ['conversational', 'authentic', 'cost-effective'],
    kieApiModelName: 'sora-2-text-to-video'
  },
  'kling-2.6': {
    id: 'kling-2.6',
    name: 'Kling 2.6',
    maxDuration: 10,
    pricing: { perSecond: 0.11 }, // $1.10 for 10s with audio
    capabilities: ['text-to-video', 'lip-sync', 'native-audio', 'dialogue'],
    bestFor: ['dialogue', 'testimonials', 'authentic-conversation'],
    kieApiModelName: 'kling-2-6-text-to-video'
  },
  'wan-2.6': {
    id: 'wan-2.6',
    name: 'Wan 2.6',
    maxDuration: 15,
    pricing: { perSecond: 0.07 }, // $0.70 for 10s, $1.05 for 15s
    capabilities: ['text-to-video', 'multi-shot', 'native-audio', 'storytelling'],
    bestFor: ['storytelling', 'narrative', 'multi-scene', 'extended-content'],
    kieApiModelName: 'wan-2-6-text-to-video'
  },
  'veo-3.1-fast': {
    id: 'veo-3.1-fast',
    name: 'Veo 3.1 Fast',
    maxDuration: 8,
    pricing: { perSecond: 0.05 }, // $0.40-0.50 for 8s
    capabilities: ['text-to-video', 'realistic', 'expressions'],
    bestFor: ['reactions', 'emotional-content', 'visual-quality'],
    kieApiModelName: 'veo-3-1-fast'
  },
  'veo-3.1-quality': {
    id: 'veo-3.1-quality',
    name: 'Veo 3.1 Quality',
    maxDuration: 8,
    pricing: { perSecond: 0.25 }, // $2.00-2.50 for 8s
    capabilities: ['text-to-video', 'premium-quality', 'cinematic'],
    bestFor: ['premium-content', 'high-fidelity', 'transformations'],
    kieApiModelName: 'veo-3-1-quality'
  },
  'hailuo-2.3': {
    id: 'hailuo-2.3',
    name: 'Hailuo 2.3 Pro',
    maxDuration: 10,
    pricing: { perSecond: 0.045 }, // $0.45 for 10s Pro
    capabilities: ['text-to-video', 'smooth-motion', 'visual-quality'],
    bestFor: ['asmr-visual', 'smooth-demos', 'cost-effective'],
    kieApiModelName: 'hailuo-2-3-text-to-video'
  },
  'runway-gen-4-turbo': {
    id: 'runway-gen-4-turbo',
    name: 'Runway Gen-4 Turbo',
    maxDuration: 10,
    pricing: { perSecond: 0.025 }, // $0.25 for 10s
    capabilities: ['image-to-video', 'fast-generation', 'iterative'],
    bestFor: ['rapid-prototyping', 'visual-content'],
    kieApiModelName: 'runway-gen-4-turbo'
  },
  'seedance-pro': {
    id: 'seedance-pro',
    name: 'Seedance Pro Fast',
    maxDuration: 10,
    pricing: { perSecond: 0.018 }, // $0.18 for 10s 720p
    capabilities: ['text-to-video', 'viral-aesthetic', 'dynamic'],
    bestFor: ['viral-content', 'social-media', 'fast-generation'],
    kieApiModelName: 'seedance-pro-fast'
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
  
  // 30-second formats
  'ugc_auth_30s': { primary: 'wan-2.6', backup: 'sora2' },
  'green_screen_30s': { primary: 'wan-2.6', backup: 'sora2' },
  'pas_framework_30s': { primary: 'wan-2.6', backup: 'sora2' },
  'asmr_visual_30s': { primary: 'wan-2.6', backup: 'sora2' },
  'before_after_30s': { primary: 'wan-2.6', backup: 'sora2' }
}

/**
 * Calculate format key from style and duration
 * Normalizes style names to match format mapping keys
 * 
 * @param style - Video style (e.g., 'ugc', 'green_screen', 'pas_framework')
 * @param duration - Video duration ('10s' or '30s')
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
    'before_after': 'before_after'
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
    // Default fallback to Sora 2
    console.warn(`Format '${format}' not found in mapping, using default Sora 2`)
    return KIE_MODELS.sora2
  }
  
  const model = KIE_MODELS[mapping.primary]
  
  if (!model) {
    // Fallback to backup model
    console.warn(`Primary model '${mapping.primary}' not found, using backup '${mapping.backup}'`)
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

