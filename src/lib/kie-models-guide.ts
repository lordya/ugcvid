/**
 * Kie.ai Models Guide Data Extractor
 *
 * Provides structured access to model information from kie_ai_models_guide.md
 * Maps model IDs to their capabilities, constraints, and best practices.
 */

import { KieModel } from './kie-models'

/**
 * Model guide information extracted from kie_ai_models_guide.md
 */
export interface ModelGuideInfo {
  modelId: string
  maxDuration: number
  supportedAspectRatios: string[]
  capabilities: string[]
  bestPractices: string[]
  constraints: string[]
  useCases: string[]
}

/**
 * Guide data mapping model IDs to their structured information
 * Extracted and organized from kie_ai_models_guide.md
 */
const GUIDE_MODEL_DATA: Record<string, ModelGuideInfo> = {
  // Video Models
  'sora2': {
    modelId: 'sora2',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync'],
    bestPractices: [
      'Focus on conversational, authentic dialogue',
      'Keep visual complexity low for better performance',
      'Use natural speech patterns and pauses',
      'Avoid complex hand movements or detailed text',
      'Limit rapid camera movements'
    ],
    constraints: [
      'Limited to 10-second videos',
      'May struggle with complex hand anatomy',
      'Detailed text overlays can be blurry'
    ],
    useCases: ['conversational', 'authentic', 'cost-effective', 'simple scenes']
  },

  'sora2-temp': {
    modelId: 'sora2-temp',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    capabilities: ['text-to-video', 'image-to-video', 'audio-sync'],
    bestPractices: [
      'Focus on conversational, authentic dialogue',
      'Keep visual complexity low for better performance',
      'Use natural speech patterns and pauses',
      'Avoid complex hand movements or detailed text',
      'Limit rapid camera movements'
    ],
    constraints: [
      'Limited to 10-second videos',
      'May struggle with complex hand anatomy',
      'Detailed text overlays can be blurry'
    ],
    useCases: ['conversational', 'authentic', 'cost-effective', 'simple scenes']
  },

  'kling-2.6': {
    modelId: 'kling-2.6',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'lip-sync', 'native-audio', 'dialogue'],
    bestPractices: [
      'Emphasize dialogue and lip-sync elements',
      'Use consistent character positioning',
      'Focus on emotional expressions and reactions',
      'Keep background elements simple',
      'Avoid extreme motion blur or fast cuts'
    ],
    constraints: [
      'Limited to 10-second videos',
      'Background complexity should be minimal',
      'Fast cuts may reduce quality'
    ],
    useCases: ['dialogue', 'testimonials', 'talking heads', 'authentic-conversation']
  },

  'wan-2.6': {
    modelId: 'wan-2.6',
    maxDuration: 15,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'multi-shot', 'native-audio', 'storytelling'],
    bestPractices: [
      'Structure scripts for multi-scene storytelling',
      'Include clear scene transitions',
      'Focus on narrative flow and pacing',
      'Avoid single static shots',
      'Complex visual effects may not render well'
    ],
    constraints: [
      'Requires multiple scene transitions',
      'Complex visual effects may fail',
      'Single-shot videos underperform'
    ],
    useCases: ['storytelling', 'narrative', 'multi-scene', 'extended-content']
  },

  'veo-3.1-fast': {
    modelId: 'veo-3.1-fast',
    maxDuration: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'realistic', 'expressions'],
    bestPractices: [
      'Include detailed facial expressions and anatomy',
      'Use cinematic lighting descriptions',
      'Focus on premium visual quality elements',
      'Avoid long duration content',
      'Complex scenes should be detailed'
    ],
    constraints: [
      'Limited to 8-second videos',
      'Detailed facial features work best',
      'Complex anatomy requires precision'
    ],
    useCases: ['reactions', 'emotional-content', 'visual-quality']
  },

  'veo-3.1-quality': {
    modelId: 'veo-3.1-quality',
    maxDuration: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'premium-quality', 'cinematic'],
    bestPractices: [
      'Include detailed facial expressions and anatomy',
      'Use cinematic lighting descriptions',
      'Focus on premium visual quality elements',
      'Avoid long duration content',
      'Complex scenes should be detailed'
    ],
    constraints: [
      'Limited to 8-second videos',
      'Higher cost for premium quality',
      'Requires detailed scene descriptions'
    ],
    useCases: ['premium-content', 'high-fidelity', 'transformations']
  },

  'hailuo-2.3': {
    modelId: 'hailuo-2.3',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'smooth-motion', 'visual-quality'],
    bestPractices: [
      'Focus on smooth, fluid motion',
      'Include detailed visual descriptions',
      'Use consistent pacing throughout',
      'Avoid jerky movements',
      'Complex interactions should be smooth'
    ],
    constraints: [
      'Motion should be deliberate and smooth',
      'Complex interactions may not render well',
      'Fast movements can appear jerky'
    ],
    useCases: ['asmr-visual', 'smooth-demos', 'cost-effective']
  },

  'runway-gen-4-turbo': {
    modelId: 'runway-gen-4-turbo',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['image-to-video', 'fast-generation', 'iterative'],
    bestPractices: [
      'Provide high-quality input images',
      'Focus on clear motion descriptions',
      'Use for iterative video creation',
      'Avoid complex scene changes',
      'Keep motion simple and clear'
    ],
    constraints: [
      'Requires quality input images',
      'Complex motion may not render well',
      'Limited to image-to-video primarily'
    ],
    useCases: ['rapid-prototyping', 'visual-content']
  },

  'seedance-pro': {
    modelId: 'seedance-pro',
    maxDuration: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['text-to-video', 'viral-aesthetic', 'dynamic'],
    bestPractices: [
      'Design for viral, trending aesthetics',
      'Include dynamic and engaging motion',
      'Focus on social media appeal',
      'Use fast-paced, exciting content',
      'Keep content visually striking'
    ],
    constraints: [
      'May sacrifice quality for speed',
      'Complex scenes may not work well',
      'Focus on entertainment value over precision'
    ],
    useCases: ['viral-content', 'social-media', 'fast-generation']
  },

  'sora-2-pro': {
    modelId: 'sora-2-pro',
    maxDuration: 25,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['storyboard', 'long-form', 'cinematic', 'narrative'],
    bestPractices: [
      'Design scripts for 25-second narrative arcs',
      'Include detailed scene-by-scene breakdowns',
      'Focus on cinematic storytelling elements',
      'Requires structured scene descriptions',
      'Create coherent visual narratives'
    ],
    constraints: [
      'Requires detailed storyboard structure',
      'Higher computational cost',
      'Complex narrative requirements'
    ],
    useCases: ['narrative-ads', 'mini-docs', 'tutorials', 'storytelling']
  }
}

/**
 * Get guide information for a specific model
 *
 * @param modelId - The model ID to look up
 * @returns ModelGuideInfo for the specified model, or default if not found
 */
export function getModelGuideInfo(modelId: string): ModelGuideInfo {
  const guideInfo = GUIDE_MODEL_DATA[modelId]

  if (!guideInfo) {
    console.warn(`[Model Guide] No guide information found for model: ${modelId}`)
    // Return a default structure
    return {
      modelId,
      maxDuration: 10,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      capabilities: ['text-to-video'],
      bestPractices: ['Follow general video generation best practices'],
      constraints: [],
      useCases: ['general video generation']
    }
  }

  return guideInfo
}

/**
 * Get guide information for a KieModel instance
 *
 * @param model - KieModel instance
 * @returns ModelGuideInfo for the model
 */
export function getGuideInfoForModel(model: KieModel): ModelGuideInfo {
  return getModelGuideInfo(model.id)
}

/**
 * Get all available model IDs from the guide
 *
 * @returns Array of model IDs that have guide information
 */
export function getAvailableGuideModels(): string[] {
  return Object.keys(GUIDE_MODEL_DATA)
}

/**
 * Check if a model has guide information available
 *
 * @param modelId - Model ID to check
 * @returns True if guide information exists for the model
 */
export function hasGuideInfo(modelId: string): boolean {
  return modelId in GUIDE_MODEL_DATA
}

/**
 * Get comprehensive model information combining KieModel and GuideInfo
 *
 * @param model - KieModel instance
 * @returns Complete model information object
 */
export function getCompleteModelInfo(model: KieModel) {
  const guideInfo = getGuideInfoForModel(model)

  return {
    ...model,
    guide: guideInfo,
    // Override model maxDuration with guide info if available
    effectiveMaxDuration: guideInfo.maxDuration,
    effectiveAspectRatios: guideInfo.supportedAspectRatios,
    scriptGuidance: {
      bestPractices: guideInfo.bestPractices,
      constraints: guideInfo.constraints,
      useCases: guideInfo.useCases
    }
  }
}
