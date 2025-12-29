-- Migration: Add model_prompts table for database-driven system prompts
-- This table stores all model configurations, system prompts, and guidelines
-- Replaces hardcoded values in src/lib/prompts.ts and src/lib/kie-models.ts

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.model_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text NOT NULL,                    -- e.g., 'sora-2-text-to-video'
  model_name text NOT NULL,                   -- e.g., 'Sora 2 Text-to-Video'
  kie_api_model_name text NOT NULL,          -- Actual API model name for Kie.ai
  style text NOT NULL,                        -- e.g., 'ugc_auth', 'green_screen'
  duration text NOT NULL,                     -- e.g., '10s', '15s', '30s'
  system_prompt text NOT NULL,                -- Full system prompt template with placeholders
  negative_prompts jsonb DEFAULT '[]'::jsonb, -- Array of negative prompts for quality
  quality_instructions text,                  -- Quality-specific instructions
  guidelines jsonb,                           -- Additional guidelines/rules as JSON
  model_config jsonb,                        -- Model-specific config (pricing, capabilities, etc.)
  is_active boolean DEFAULT true,             -- Enable/disable prompts
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure unique combinations
  UNIQUE(model_id, style, duration)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Primary lookup index for finding prompts by model, style, and duration
CREATE INDEX IF NOT EXISTS idx_model_prompts_lookup
ON public.model_prompts(model_id, style, duration);

-- Index for finding all models available for a style/duration combination
CREATE INDEX IF NOT EXISTS idx_model_prompts_style_duration
ON public.model_prompts(style, duration);

-- Index for filtering active prompts
CREATE INDEX IF NOT EXISTS idx_model_prompts_active
ON public.model_prompts(is_active) WHERE is_active = true;

-- Index for model_id lookups
CREATE INDEX IF NOT EXISTS idx_model_prompts_model_id
ON public.model_prompts(model_id);

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_model_prompts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_model_prompts_updated_at
  BEFORE UPDATE ON public.model_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_model_prompts_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.model_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active model prompts (for script generation)
CREATE POLICY "Users can read active model prompts"
ON public.model_prompts
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Only admins can insert/update/delete model prompts
CREATE POLICY "Admins can manage model prompts"
ON public.model_prompts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE public.model_prompts IS 'Database-driven storage for model configurations, system prompts, and guidelines';
COMMENT ON COLUMN public.model_prompts.model_id IS 'Unique identifier for the AI model (e.g., sora-2-text-to-video)';
COMMENT ON COLUMN public.model_prompts.model_name IS 'Human-readable model name (e.g., Sora 2 Text-to-Video)';
COMMENT ON COLUMN public.model_prompts.kie_api_model_name IS 'Actual model name used in Kie.ai API calls';
COMMENT ON COLUMN public.model_prompts.style IS 'Video style (e.g., ugc_auth, green_screen, pas_framework)';
COMMENT ON COLUMN public.model_prompts.duration IS 'Video duration (e.g., 10s, 15s, 30s)';
COMMENT ON COLUMN public.model_prompts.system_prompt IS 'Full system prompt template with [PRODUCT_NAME] and [PRODUCT_DESCRIPTION] placeholders';
COMMENT ON COLUMN public.model_prompts.negative_prompts IS 'Array of negative prompts to avoid quality issues';
COMMENT ON COLUMN public.model_prompts.quality_instructions IS 'Quality-specific instructions for optimal results';
COMMENT ON COLUMN public.model_prompts.guidelines IS 'Additional guidelines and rules as JSON object';
COMMENT ON COLUMN public.model_prompts.model_config IS 'Model configuration including pricing, capabilities, and constraints';
COMMENT ON COLUMN public.model_prompts.is_active IS 'Whether this prompt configuration is active and available for use';
