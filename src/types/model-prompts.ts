/**
 * TypeScript types for the model prompts system
 */

export interface ModelPrompt {
  id: string
  model_id: string
  model_name: string
  kie_api_model_name: string
  style: string
  duration: string
  system_prompt: string
  negative_prompts: string[]
  quality_instructions: string | null
  guidelines: Record<string, any> | null
  model_config: ModelConfig | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ModelConfig {
  pricing: {
    perSecond: number
    creditsPerSecond?: number
  }
  maxDuration: number
  capabilities: string[]
  bestFor: string[]
}

export interface ModelPromptQuery {
  modelId?: string
  style?: string
  duration?: string
  isActive?: boolean
}

export interface ModelPromptInsert {
  model_id: string
  model_name: string
  kie_api_model_name: string
  style: string
  duration: string
  system_prompt: string
  negative_prompts?: string[]
  quality_instructions?: string | null
  guidelines?: Record<string, any> | null
  model_config?: ModelConfig | null
  is_active?: boolean
}

export interface ModelPromptUpdate extends Partial<ModelPromptInsert> {
  id: string
}

/**
 * Database response types (from Supabase)
 */
export type ModelPromptRow = ModelPrompt

export type ModelPromptResponse = {
  data: ModelPromptRow | null
  error: any
}

export type ModelPromptsResponse = {
  data: ModelPromptRow[] | null
  error: any
}
