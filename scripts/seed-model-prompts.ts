#!/usr/bin/env tsx

/**
 * Model Prompts Seeder Script
 *
 * Seeds the model_prompts table with data from markdown documentation files.
 * Can be run to populate initial data or update existing prompts.
 *
 * Usage:
 *   npm run seed:model-prompts
 *   # or
 *   tsx scripts/seed-model-prompts.ts
 */

import { createClient } from '../src/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'
import { MODEL_QUALITY_CONFIGS } from '../src/lib/kie-models'

interface ParsedPrompt {
  id: string
  style: string
  duration: string
  systemPrompt: string
  criticalRules: string[]
}

interface ParsedModel {
  id: string
  name: string
  kieApiModelName: string
  pricing: { perSecond: number }
  maxDuration: number
  capabilities: string[]
  bestFor: string[]
  negativePrompts: string[]
  qualityInstructions: string
}

interface ModelPromptData {
  model_id: string
  model_name: string
  kie_api_model_name: string
  style: string
  duration: string
  system_prompt: string
  negative_prompts: string[]
  quality_instructions: string | null
  guidelines: Record<string, any> | null
  model_config: Record<string, any> | null
}

/**
 * Parse template-system-prompts.md to extract system prompts
 */
function parseTemplatePrompts(): ParsedPrompt[] {
  const filePath = path.join(__dirname, '..', 'Docs', 'template-system-prompts.md')
  const content = fs.readFileSync(filePath, 'utf-8')

  const prompts: ParsedPrompt[] = []

  // Split by sections (each style starts with "## X. Style:")
  const sections = content.split(/^## \d+\. Style:/m)

  for (const section of sections.slice(1)) { // Skip the first empty part
    const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    if (lines.length === 0) continue

    // Extract style name
    const styleLine = lines[0]
    let style = ''
    if (styleLine.includes('UGC Authenticité')) style = 'ugc_auth'
    else if (styleLine.includes('Green Screen React')) style = 'green_screen'
    else if (styleLine.includes('Problem-Agitation-Solution')) style = 'pas_framework'
    else if (styleLine.includes('Satisfying/ASMR')) style = 'asmr_visual'
    else if (styleLine.includes('Before/After Transformation')) style = 'before_after'
    else continue

    // Find all prompt sections in this style
    const promptSections = section.split(/^System Prompt \((10|30)s\):/m)

    for (let i = 1; i < promptSections.length; i += 2) {
      const duration = promptSections[i].replace('s', 's')
      const promptContent = promptSections[i + 1]

      if (!promptContent) continue

      // Extract ID
      const idMatch = promptContent.match(/ID: (\w+)/)
      if (!idMatch) continue
      const id = idMatch[1]

      // Extract system prompt (everything before CRITICAL RULES)
      const criticalRulesIndex = promptContent.indexOf('CRITICAL RULES:')
      const systemPrompt = criticalRulesIndex !== -1
        ? promptContent.substring(0, criticalRulesIndex).trim()
        : promptContent.trim()

      // Extract critical rules
      const criticalRules: string[] = []
      if (criticalRulesIndex !== -1) {
        const rulesSection = promptContent.substring(criticalRulesIndex + 'CRITICAL RULES:'.length)
        const rules = rulesSection.split('\n')
          .map(line => line.trim())
          .filter(line => line.match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, ''))
      }

      prompts.push({
        id,
        style,
        duration,
        systemPrompt,
        criticalRules
      })
    }
  }

  return prompts
}

/**
 * Parse kie_ai_models_guide.md to extract model information
 */
function parseKieModelsGuide(): ParsedModel[] {
  const filePath = path.join(__dirname, '..', 'kie_ai_models_guide.md')
  const content = fs.readFileSync(filePath, 'utf-8')

  const models: ParsedModel[] = []

  // Extract model information from the guide
  // This is a simplified parser - you might need to make it more robust
  const veoMatch = content.match(/### Veo3\.1 API[\s\S]*?### Runway API/)
  const runwayMatch = content.match(/### Runway API[\s\S]*?### Luma API/)
  const klingMatch = content.match(/### Kling Models[\s\S]*?### Sora2 Models/)
  const soraMatch = content.match(/### Sora2 Models[\s\S]*?### Bytedance Models/)
  const hailuoMatch = content.match(/### Hailuo Models[\s\S]*?### Grok Imagine Video/)

  // Parse individual models
  const modelSections = [
    { content: veoMatch?.[0] || '', models: ['veo-3.1-fast', 'veo-3.1-quality'] },
    { content: runwayMatch?.[0] || '', models: ['runway-gen-4-turbo'] },
    { content: klingMatch?.[0] || '', models: ['kling-2.1-master', 'kling-2.6'] },
    { content: soraMatch?.[0] || '', models: ['sora-2-text-to-video', 'sora-2-pro'] },
    { content: hailuoMatch?.[0] || '', models: ['hailuo-2.3'] }
  ]

  for (const section of modelSections) {
    for (const modelId of section.models) {
      const modelConfig = MODEL_QUALITY_CONFIGS[modelId]
      if (!modelConfig) continue

      // Extract basic model info from the guide content
      let modelName = modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      let kieApiModelName = modelId
      let pricing = { perSecond: 0.1 } // Default
      let maxDuration = 10 // Default

      // Try to extract more specific info
      if (modelId.includes('veo-3.1-fast')) {
        modelName = 'Veo 3.1 Fast'
        kieApiModelName = 'veo3_fast'
        pricing = { perSecond: 0.05 }
        maxDuration = 8
      } else if (modelId.includes('veo-3.1-quality')) {
        modelName = 'Veo 3.1 Quality'
        kieApiModelName = 'veo3'
        pricing = { perSecond: 0.25 }
        maxDuration = 8
      } else if (modelId.includes('runway')) {
        modelName = 'Runway Gen-4 Turbo'
        kieApiModelName = 'runway-duration-5-generate'
        pricing = { perSecond: 0.025 }
        maxDuration = 10
      } else if (modelId.includes('kling-2.6')) {
        modelName = 'Kling 2.6'
        kieApiModelName = 'kling/v2-1-standard'
        pricing = { perSecond: 0.11 }
        maxDuration = 10
      } else if (modelId.includes('sora-2-text-to-video')) {
        modelName = 'Sora 2 Text-to-Video'
        kieApiModelName = 'sora-2-pro-text-to-video'
        pricing = { perSecond: 0.015 }
        maxDuration = 10
      } else if (modelId.includes('sora-2-pro')) {
        modelName = 'Sora 2 Pro Storyboard'
        kieApiModelName = 'sora-2-pro-storyboard'
        pricing = { perSecond: 0.04 }
        maxDuration = 25
      } else if (modelId.includes('hailuo-2.3')) {
        modelName = 'Hailuo 2.3 Pro'
        kieApiModelName = 'hailuo/02-text-to-video-pro'
        pricing = { perSecond: 0.045 }
        maxDuration = 10
      }

      models.push({
        id: modelId,
        name: modelName,
        kieApiModelName,
        pricing,
        maxDuration,
        capabilities: modelConfig.recommendedFor || [],
        bestFor: modelConfig.recommendedFor || [],
        negativePrompts: modelConfig.negativePrompt,
        qualityInstructions: modelConfig.qualityInstructions
      })
    }
  }

  return models
}

/**
 * Generate model prompt combinations based on FORMAT_MODEL_MAPPING
 */
function generateModelPrompts(
  prompts: ParsedPrompt[],
  models: ParsedModel[]
): ModelPromptData[] {
  const result: ModelPromptData[] = []

  // Import the mapping from kie-models.ts
  const FORMAT_MODEL_MAPPING: Record<string, { primary: string; backup: string }> = {
    'ugc_auth_10s': { primary: 'sora-2-text-to-video', backup: 'kling-2.6' },
    'ugc_auth_15s': { primary: 'sora-2-text-to-video', backup: 'wan-2.6' },
    'green_screen_10s': { primary: 'kling-2.6', backup: 'veo-3.1-fast' },
    'green_screen_15s': { primary: 'kling-2.6', backup: 'wan-2.6' },
    'pas_framework_10s': { primary: 'wan-2.6', backup: 'sora-2-text-to-video' },
    'pas_framework_15s': { primary: 'wan-2.6', backup: 'sora-2-pro' },
    'asmr_visual_10s': { primary: 'hailuo-2.3', backup: 'wan-2.6' },
    'asmr_visual_15s': { primary: 'hailuo-2.3', backup: 'wan-2.6' },
    'before_after_15s': { primary: 'veo-3.1-quality', backup: 'wan-2.6' },
    'storyboard_25s': { primary: 'sora-2-pro', backup: 'wan-2.6' }
  }

  for (const prompt of prompts) {
    const formatKey = `${prompt.style}_${prompt.duration}`
    const mapping = FORMAT_MODEL_MAPPING[formatKey]

    if (!mapping) continue

    const model = models.find(m => m.id === mapping.primary)
    if (!model) continue

    result.push({
      model_id: model.id,
      model_name: model.name,
      kie_api_model_name: model.kieApiModelName,
      style: prompt.style,
      duration: prompt.duration,
      system_prompt: prompt.systemPrompt,
      negative_prompts: model.negativePrompts,
      quality_instructions: model.qualityInstructions,
      guidelines: { critical_rules: prompt.criticalRules },
      model_config: {
        pricing: model.pricing,
        maxDuration: model.maxDuration,
        capabilities: model.capabilities,
        bestFor: model.bestFor
      }
    })
  }

  return result
}

/**
 * Seed the database with model prompts
 */
async function seedModelPrompts(): Promise<void> {
  console.log('🚀 Starting model prompts seeding...')

  try {
    // Parse markdown files
    console.log('📖 Parsing template-system-prompts.md...')
    const prompts = parseTemplatePrompts()
    console.log(`   Found ${prompts.length} prompts`)

    console.log('📖 Parsing kie_ai_models_guide.md...')
    const models = parseKieModelsGuide()
    console.log(`   Found ${models.length} models`)

    // Generate model prompt combinations
    console.log('🔗 Generating model-prompt combinations...')
    const modelPrompts = generateModelPrompts(prompts, models)
    console.log(`   Generated ${modelPrompts.length} combinations`)

    // Insert into database
    const supabase = await createClient()

    for (const promptData of modelPrompts) {
      console.log(`   Inserting ${promptData.model_id} + ${promptData.style}_${promptData.duration}...`)

      const { error } = await supabase
        .from('model_prompts')
        .upsert(promptData, {
          onConflict: 'model_id,style,duration',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`   ❌ Error inserting ${promptData.model_id}:`, error.message)
      } else {
        console.log(`   ✅ Inserted ${promptData.model_id}`)
      }
    }

    console.log('🎉 Model prompts seeding completed!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seeder if this script is executed directly
if (require.main === module) {
  seedModelPrompts()
    .then(() => {
      console.log('✅ Seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export { seedModelPrompts, parseTemplatePrompts, parseKieModelsGuide }
