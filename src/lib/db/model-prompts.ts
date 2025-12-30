/**
 * Database service layer for model prompts
 *
 * Provides functions to fetch and manage model prompts from the database.
 * Includes fallback logic for when database queries fail.
 */

import { createClient } from '@/lib/supabase/server'
import { ModelPrompt, ModelPromptQuery, ModelPromptInsert, ModelPromptUpdate } from '@/types/model-prompts'

/**
 * Get a system prompt by model ID, style, and duration
 *
 * @param modelId - The model ID (e.g., 'sora-2-text-to-video')
 * @param style - The style (e.g., 'ugc_auth')
 * @param duration - The duration (e.g., '10s')
 * @returns Promise<ModelPrompt | null>
 */
export async function getSystemPrompt(
  modelId: string,
  style: string,
  duration: string
): Promise<ModelPrompt | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .select('*')
      .eq('model_id', modelId)
      .eq('style', style)
      .eq('duration', duration)
      .eq('is_active', true)
      .single()

    if (error) {
      console.warn(`[ModelPrompts] Failed to fetch prompt for ${modelId}/${style}/${duration}:`, error.message)
      return null
    }

    return data as ModelPrompt
  } catch (error) {
    console.error(`[ModelPrompts] Error fetching system prompt:`, error)
    return null
  }
}

/**
 * Get a model prompt by key (style_duration format)
 *
 * @param key - The prompt key (e.g., 'ugc_auth_15s')
 * @returns Promise<ModelPrompt | null>
 */
export async function getModelPromptByKey(key: string): Promise<ModelPrompt | null> {
  // Handle special case prompts that don't follow style_duration format
  if (key === 'god_mode_script') {
    // For god_mode_script, we don't need format-specific logic
    // Just query for any model that can handle this prompt
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('model_prompts')
        .select('*')
        .eq('prompt_key', key)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.warn(`[ModelPrompts] Error fetching god_mode_script:`, error)
      return null
    }
  }

  // Parse format key: e.g., 'ugc_auth_15s' -> style: 'ugc_auth', duration: '15s'
  // Duration always ends with 's', so find the last underscore before the duration
  const durationMatch = key.match(/_(\d+s)$/)
  if (!durationMatch) {
    console.warn(`[ModelPrompts] Invalid format key: ${key} (expected format: style_duration, e.g., ugc_auth_15s)`)
    return null
  }
  
  const duration = durationMatch[1] // e.g., '15s'
  const style = key.slice(0, durationMatch.index) // Everything before '_15s'
  
  const modelId = await findBestModelForFormat(style, duration)

  if (!modelId) {
    console.warn(`[ModelPrompts] No model found for format ${style}_${duration}`)
    return null
  }

  return getSystemPrompt(modelId, style, duration)
}

/**
 * Get model configuration by model ID
 *
 * @param modelId - The model ID
 * @returns Promise<ModelPrompt | null>
 */
export async function getModelConfig(modelId: string): Promise<ModelPrompt | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .select('*')
      .eq('model_id', modelId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error) {
      console.warn(`[ModelPrompts] Failed to fetch model config for ${modelId}:`, error.message)
      return null
    }

    return data as ModelPrompt
  } catch (error) {
    console.error(`[ModelPrompts] Error fetching model config:`, error)
    return null
  }
}

/**
 * Get negative prompts for a model
 *
 * @param modelId - The model ID
 * @returns Promise<string[]>
 */
export async function getNegativePrompts(modelId: string): Promise<string[]> {
  const modelPrompt = await getModelConfig(modelId)
  return modelPrompt?.negative_prompts || []
}

/**
 * Get quality instructions for a model
 *
 * @param modelId - The model ID
 * @returns Promise<string | null>
 */
export async function getQualityInstructions(modelId: string): Promise<string | null> {
  const modelPrompt = await getModelConfig(modelId)
  return modelPrompt?.quality_instructions || null
}

/**
 * Get all active model prompts for a style and duration combination
 *
 * @param style - The style (e.g., 'ugc_auth')
 * @param duration - The duration (e.g., '15s')
 * @returns Promise<ModelPrompt[]>
 */
export async function getAllModelsForStyle(style: string, duration: string): Promise<ModelPrompt[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .select('*')
      .eq('style', style)
      .eq('duration', duration)
      .eq('is_active', true)
      .order('model_id')

    if (error) {
      console.warn(`[ModelPrompts] Failed to fetch models for ${style}/${duration}:`, error.message)
      return []
    }

    return (data as ModelPrompt[]) || []
  } catch (error) {
    console.error(`[ModelPrompts] Error fetching models for style:`, error)
    return []
  }
}

/**
 * Find the best model for a given format based on priority
 *
 * @param style - The style
 * @param duration - The duration
 * @returns Promise<string | null> - The best model ID
 */
export async function findBestModelForFormat(style: string, duration: string): Promise<string | null> {
  // Format to model mapping (same logic as FORMAT_MODEL_MAPPING in kie-models.ts)
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

  const formatKey = `${style}_${duration}`
  const mapping = FORMAT_MODEL_MAPPING[formatKey]

  if (!mapping) {
    console.warn(`[ModelPrompts] No mapping found for format ${formatKey}`)
    return null
  }

  // Try primary model first
  const primaryExists = await checkModelExists(mapping.primary, style, duration)
  if (primaryExists) {
    return mapping.primary
  }

  // Fallback to backup model
  const backupExists = await checkModelExists(mapping.backup, style, duration)
  if (backupExists) {
    return mapping.backup
  }

  console.warn(`[ModelPrompts] Neither primary (${mapping.primary}) nor backup (${mapping.backup}) model available for ${formatKey}`)
  return null
}

/**
 * Check if a model exists for the given style and duration
 *
 * @param modelId - The model ID
 * @param style - The style
 * @param duration - The duration
 * @returns Promise<boolean>
 */
async function checkModelExists(modelId: string, style: string, duration: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .select('id')
      .eq('model_id', modelId)
      .eq('style', style)
      .eq('duration', duration)
      .eq('is_active', true)
      .limit(1)

    if (error) {
      return false
    }

    return (data && data.length > 0)
  } catch (error) {
    return false
  }
}

/**
 * Search model prompts with flexible criteria
 *
 * @param query - Search criteria
 * @returns Promise<ModelPrompt[]>
 */
export async function searchModelPrompts(query: ModelPromptQuery): Promise<ModelPrompt[]> {
  try {
    const supabase = await createClient()

    let dbQuery = supabase
      .from('model_prompts')
      .select('*')

    if (query.modelId) {
      dbQuery = dbQuery.eq('model_id', query.modelId)
    }

    if (query.style) {
      dbQuery = dbQuery.eq('style', query.style)
    }

    if (query.duration) {
      dbQuery = dbQuery.eq('duration', query.duration)
    }

    if (query.isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', query.isActive)
    }

    const { data, error } = await dbQuery.order('model_id, style, duration')

    if (error) {
      console.warn(`[ModelPrompts] Failed to search prompts:`, error.message)
      return []
    }

    return (data as ModelPrompt[]) || []
  } catch (error) {
    console.error(`[ModelPrompts] Error searching prompts:`, error)
    return []
  }
}

/**
 * Insert a new model prompt
 *
 * @param prompt - The prompt data to insert
 * @returns Promise<ModelPrompt | null>
 */
export async function insertModelPrompt(prompt: ModelPromptInsert): Promise<ModelPrompt | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .insert(prompt)
      .select()
      .single()

    if (error) {
      console.error(`[ModelPrompts] Failed to insert prompt:`, error.message)
      return null
    }

    return data as ModelPrompt
  } catch (error) {
    console.error(`[ModelPrompts] Error inserting prompt:`, error)
    return null
  }
}

/**
 * Update an existing model prompt
 *
 * @param id - The prompt ID
 * @param updates - The fields to update
 * @returns Promise<ModelPrompt | null>
 */
export async function updateModelPrompt(id: string, updates: Partial<ModelPromptUpdate>): Promise<ModelPrompt | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('model_prompts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`[ModelPrompts] Failed to update prompt ${id}:`, error.message)
      return null
    }

    return data as ModelPrompt
  } catch (error) {
    console.error(`[ModelPrompts] Error updating prompt:`, error)
    return null
  }
}

/**
 * Deactivate a model prompt (soft delete)
 *
 * @param id - The prompt ID
 * @returns Promise<boolean>
 */
export async function deactivateModelPrompt(id: string): Promise<boolean> {
  return !!(await updateModelPrompt(id, { is_active: false }))
}

/**
 * Get all active model prompts (admin function)
 *
 * @returns Promise<ModelPrompt[]>
 */
export async function getAllActiveModelPrompts(): Promise<ModelPrompt[]> {
  return searchModelPrompts({ isActive: true })
}
