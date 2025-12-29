/**
 * Model-Aware Script Generation
 *
 * Provides model selection and constraint handling for script generation
 * to ensure scripts respect Kie.ai model capabilities and best practices.
 */

import { KieModel, selectModelForFormat, selectModelForQualityRisk, getFormatKey } from './kie-models'
import { QualityRiskLevel } from './quality-analysis'
import { QualityTier } from './prompts'
import { StructuredScriptContent } from '@/types/supabase'
import { getGuideInfoForModel, getCompleteModelInfo } from './kie-models-guide'

/**
 * Model constraints extracted from kie_ai_models_guide.md
 */
export interface ModelConstraints {
  maxDuration: number
  supportedAspectRatios: string[]
  capabilities: string[]
  bestPractices: string[]
  constraints: string[]
  useCases: string[]
}

/**
 * Script validation result
 */
export interface ValidationResult {
  isValid: boolean
  warnings: string[]
  suggestions: string[]
  estimatedDuration: number
}

/**
 * Model guidance for prompt enhancement
 */
export interface ModelGuidance {
  durationConstraints: string
  capabilityFocus: string
  bestPractices: string[]
  avoid: string[]
}

/**
 * Select optimal model for script generation based on format, risk level, and user tier
 *
 * @param style - Video style (e.g., 'ugc_auth', 'green_screen')
 * @param duration - Video duration (e.g., '10s', '15s')
 * @param riskLevel - Optional quality risk level assessment
 * @param userTier - Optional user quality tier (standard/premium)
 * @returns Selected KieModel instance
 */
export function getModelForScriptGeneration(
  style: string,
  duration: string,
  riskLevel?: QualityRiskLevel,
  userTier?: QualityTier
): KieModel {
  // Generate format key (e.g., 'ugc_auth_15s')
  const format = getFormatKey(style, duration)

  // If we have risk level and user tier, use quality-based selection
  if (riskLevel && userTier) {
    return selectModelForQualityRisk(format, riskLevel, userTier)
  }

  // Otherwise use format-based selection
  return selectModelForFormat(format)
}

/**
 * Extract model constraints from the guide data
 *
 * @param model - KieModel instance
 * @returns ModelConstraints for the given model
 */
export function getModelConstraints(model: KieModel): ModelConstraints {
  const guideInfo = getGuideInfoForModel(model)

  return {
    maxDuration: guideInfo.maxDuration,
    supportedAspectRatios: guideInfo.supportedAspectRatios,
    capabilities: guideInfo.capabilities,
    bestPractices: guideInfo.bestPractices,
    constraints: guideInfo.constraints,
    useCases: guideInfo.useCases
  }
}

/**
 * Create model guidance for prompt enhancement
 *
 * @param model - Selected KieModel
 * @param constraints - Model constraints
 * @returns ModelGuidance object with prompt enhancement strings
 */
export function createModelGuidance(model: KieModel, constraints: ModelConstraints): ModelGuidance {
  const durationConstraints = `This script will be generated for ${model.name} which supports up to ${constraints.maxDuration} seconds. Ensure the total script duration fits within this limit.`

  const capabilityFocus = `Focus on ${constraints.capabilities.join(', ')} as this model excels at ${constraints.useCases.join(', ')}.`

  const bestPractices = constraints.bestPractices.map(practice => `• ${practice}`)

  const avoid = constraints.constraints.map(constraint => `• ${constraint}`)

  return {
    durationConstraints,
    capabilityFocus,
    bestPractices,
    avoid
  }
}

/**
 * Enhance system prompt with model-specific guidance
 *
 * @param systemPrompt - Original system prompt
 * @param model - Selected KieModel
 * @param constraints - Model constraints
 * @returns Enhanced prompt with model guidance
 */
export function enhancePromptWithModelGuidance(
  systemPrompt: string,
  model: KieModel,
  constraints: ModelConstraints
): string {
  const guidance = createModelGuidance(model, constraints)

  const modelGuidanceSection = `
⚠️ MODEL-SPECIFIC REQUIREMENTS ⚠️

${guidance.durationConstraints}

${guidance.capabilityFocus}

BEST PRACTICES FOR ${model.name.toUpperCase()}:
${guidance.bestPractices.join('\n')}

CONSTRAINTS TO AVOID:
${guidance.avoid.join('\n')}

INTEGRATE THESE REQUIREMENTS NATURALLY INTO YOUR SCRIPT DESIGN.
`

  // Insert model guidance before the CRITICAL RULES section
  const criticalRulesIndex = systemPrompt.indexOf('CRITICAL RULES:')
  if (criticalRulesIndex !== -1) {
    return systemPrompt.slice(0, criticalRulesIndex) +
           modelGuidanceSection +
           '\n' +
           systemPrompt.slice(criticalRulesIndex)
  }

  // Fallback: append to end
  return systemPrompt + modelGuidanceSection
}

/**
 * Validate generated script against model constraints
 *
 * @param script - Generated structured script content
 * @param model - KieModel used for validation
 * @returns ValidationResult with warnings and suggestions
 */
export function validateScriptAgainstModel(
  script: StructuredScriptContent,
  model: KieModel
): ValidationResult {
  const warnings: string[] = []
  const suggestions: string[] = []

  // Estimate total duration from visual cues
  let estimatedDuration = 0
  if (script.visual_cues) {
    // Count scenes and estimate duration (assuming ~5 seconds per major scene transition)
    const sceneCount = script.visual_cues.length
    estimatedDuration = Math.min(sceneCount * 5, model.maxDuration)

    // Check duration constraint
    if (estimatedDuration > model.maxDuration) {
      warnings.push(`Estimated script duration (${estimatedDuration}s) exceeds model maximum (${model.maxDuration}s)`)
      suggestions.push(`Reduce the number of scenes or shorten scene descriptions to fit within ${model.maxDuration} seconds`)
    }
  }

  // Model-specific validations
  switch (model.id) {
    case 'kling-2.6':
      // Check for dialogue elements
      if (script.voiceover && script.voiceover.some(line => line.length < 10)) {
        warnings.push('Kling 2.6 excels at dialogue but some voiceover lines are very short')
        suggestions.push('Expand dialogue lines to better utilize Kling\'s lip-sync capabilities')
      }
      break

    case 'wan-2.6':
      // Check for multi-scene structure
      if (!script.visual_cues || script.visual_cues.length < 3) {
        warnings.push('Wan 2.6 performs best with multi-scene content')
        suggestions.push('Add more scene transitions and visual variety to leverage Wan\'s storytelling strengths')
      }
      break

    case 'sora-2-pro':
      // Check for storyboard structure
      if (!script.visual_cues || script.visual_cues.length < 5) {
        warnings.push('Sora 2 Pro works best with detailed storyboard structures')
        suggestions.push('Create more detailed scene breakdowns (aim for 5+ distinct scenes) for optimal narrative flow')
      }
      break
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
    estimatedDuration
  }
}

/**
 * Get model information formatted for API response
 *
 * @param model - KieModel instance
 * @param constraints - Model constraints
 * @returns Formatted model information for API response
 */
export function getModelInfoForResponse(model: KieModel, constraints: ModelConstraints) {
  return {
    id: model.id,
    name: model.name,
    maxDuration: constraints.maxDuration,
    supportedAspectRatios: constraints.supportedAspectRatios,
    capabilities: constraints.capabilities,
    bestPractices: constraints.bestPractices,
    constraints: constraints.constraints,
    useCases: constraints.useCases,
    pricing: model.pricing
  }
}
