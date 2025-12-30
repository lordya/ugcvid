-- Migration: Add script engine tables for dynamic marketing strategies
-- This migration creates the script_angles and video_scripts tables
-- to support the Script Database Schema feature

-- ============================================
-- 1. CREATE SCRIPT_ANGLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.script_angles (
  id text PRIMARY KEY,                    -- slug-like identifier (e.g., 'cost_saver')
  label text NOT NULL,                    -- human-readable label (e.g., 'Cost Comparison')
  description text NOT NULL,              -- internal description for admins
  keywords text[] NOT NULL,               -- mandatory words/phrases for this angle
  prompt_template text NOT NULL,          -- specific instructions for this angle
  is_active boolean DEFAULT true,         -- enable/disable angle
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. CREATE VIDEO_SCRIPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.video_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  angle_id text NOT NULL REFERENCES public.script_angles(id) ON DELETE CASCADE,
  content text NOT NULL,                  -- the raw generated script content
  is_selected boolean DEFAULT false,      -- whether this script was selected by user
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Indexes for script_angles table
CREATE INDEX IF NOT EXISTS idx_script_angles_active
ON public.script_angles(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_script_angles_id_active
ON public.script_angles(id, is_active);

-- Indexes for video_scripts table
CREATE INDEX IF NOT EXISTS idx_video_scripts_video_id
ON public.video_scripts(video_id);

CREATE INDEX IF NOT EXISTS idx_video_scripts_angle_id
ON public.video_scripts(angle_id);

CREATE INDEX IF NOT EXISTS idx_video_scripts_video_angle
ON public.video_scripts(video_id, angle_id);

CREATE INDEX IF NOT EXISTS idx_video_scripts_selected
ON public.video_scripts(is_selected) WHERE is_selected = true;

-- ============================================
-- 4. CREATE UPDATED_AT TRIGGER FOR SCRIPT_ANGLES
-- ============================================

CREATE OR REPLACE FUNCTION update_script_angles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_script_angles_updated_at
  BEFORE UPDATE ON public.script_angles
  FOR EACH ROW
  EXECUTE FUNCTION update_script_angles_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE public.script_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scripts ENABLE ROW LEVEL SECURITY;

-- script_angles policies: Read accessible to authenticated users
CREATE POLICY "Users can read active script angles"
ON public.script_angles
FOR SELECT
TO authenticated
USING (is_active = true);

-- script_angles policies: Only admins can manage angles
CREATE POLICY "Admins can manage script angles"
ON public.script_angles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- video_scripts policies: Users can CRUD their own scripts
CREATE POLICY "Users can view their own video scripts"
ON public.video_scripts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_scripts.video_id
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own video scripts"
ON public.video_scripts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_scripts.video_id
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own video scripts"
ON public.video_scripts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_scripts.video_id
    AND videos.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own video scripts"
ON public.video_scripts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_scripts.video_id
    AND videos.user_id = auth.uid()
  )
);

-- ============================================
-- 6. SEED DATA: 8 PROVEN SCRIPT ANGLES
-- ============================================

INSERT INTO public.script_angles (
  id,
  label,
  description,
  keywords,
  prompt_template
) VALUES
-- 1. Cost Comparison
(
  'cost_saver',
  'Cost Comparison',
  'Emphasizes how the product saves money compared to alternatives or the cost of not using it',
  ARRAY['literally shook', 'money saver', 'costs less than', 'save hundreds', 'worth every penny'],
  'Focus on financial benefits and cost savings. Highlight how much money users save compared to alternatives or the cost of problems this product solves. Use phrases like "costs less than" and "worth every penny" to emphasize value.'
),
-- 2. Hidden Feature
(
  'hidden_gem',
  'Hidden Feature',
  'Reveals an unexpected bonus feature or capability that users wouldn''t expect',
  ARRAY['bonus feature', 'hidden gem', 'you won''t believe', 'extra benefit', 'secret advantage'],
  'Reveal surprising additional benefits or features. Focus on capabilities that go beyond the main selling point. Create excitement around "hidden" or unexpected advantages that delight users.'
),
-- 3. Product Test
(
  'product_test',
  'Product Test',
  'Shows scientific testing, lab results, or rigorous validation of the product''s effectiveness',
  ARRAY['scientifically proven', 'lab tested', 'clinical results', 'independently verified', 'back by science'],
  'Emphasize scientific validation and testing. Reference lab results, clinical studies, or independent verification. Use credible, research-backed language to build trust through evidence.'
),
-- 4. Effortless Expert
(
  'effortless_expert',
  'Effortless Expert',
  'Positions the user as an expert or insider who discovered something amazing',
  ARRAY['game changer', 'total game changer', 'level up', 'next level', 'expert approved'],
  'Make the user feel like an insider or expert. Position them as someone who discovered a superior solution. Use phrases that elevate their status and make them feel knowledgeable.'
),
-- 5. Mind Reading
(
  'mind_reading',
  'Mind Reading',
  'Demonstrates deep understanding of the user''s pain points and frustrations',
  ARRAY['I get it', 'I know exactly', 'you''re not alone', 'struggling with', 'tired of'],
  'Show deep empathy and understanding of user frustrations. Validate their pain points and make them feel understood. Create connection through shared experience and relatability.'
),
-- 6. Emotional Connection
(
  'emotional_connection',
  'Emotional Connection',
  'Creates an emotional bond by addressing feelings, relationships, or personal satisfaction',
  ARRAY['finally feel', 'emotional relief', 'heartwarming', 'peace of mind', 'family approved'],
  'Focus on emotional benefits and personal satisfaction. Address how the product makes users feel, strengthens relationships, or brings peace of mind. Appeal to emotions over logic.'
),
-- 7. Machine Comparison
(
  'machine_comparison',
  'Machine Comparison',
  'Compares the product favorably to expensive machines, tools, or professional services',
  ARRAY['beats the machine', 'professional results', 'replaces expensive', 'no need for', 'better than professional'],
  'Compare to expensive alternatives or professional services. Show how the product delivers professional-quality results at a fraction of the cost. Emphasize convenience and accessibility.'
),
-- 8. Social Proof
(
  'social_proof',
  'Social Proof',
  'Leverages testimonials, reviews, or social validation from others',
  ARRAY['everyone''s talking', 'viral sensation', 'thousands of reviews', 'social media favorite', 'crowd favorite'],
  'Highlight social validation and popularity. Reference reviews, testimonials, or social media buzz. Show how others are raving about the product and create FOMO through social proof.'
);

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE public.script_angles IS 'Dynamic marketing strategy angles for script generation with customizable keywords and prompts';
COMMENT ON COLUMN public.script_angles.id IS 'Slug-like identifier for the script angle (e.g., cost_saver)';
COMMENT ON COLUMN public.script_angles.label IS 'Human-readable label displayed to users (e.g., Cost Comparison)';
COMMENT ON COLUMN public.script_angles.description IS 'Internal description for administrators';
COMMENT ON COLUMN public.script_angles.keywords IS 'Mandatory words/phrases that must appear in scripts using this angle';
COMMENT ON COLUMN public.script_angles.prompt_template IS 'Specific instructions for AI to follow when generating scripts with this angle';
COMMENT ON COLUMN public.script_angles.is_active IS 'Whether this angle is available for use in script generation';

COMMENT ON TABLE public.video_scripts IS 'Generated scripts for specific videos using different marketing angles';
COMMENT ON COLUMN public.video_scripts.video_id IS 'Reference to the video this script was generated for';
COMMENT ON COLUMN public.video_scripts.angle_id IS 'Reference to the script angle used for generation';
COMMENT ON COLUMN public.video_scripts.content IS 'The raw generated script content';
COMMENT ON COLUMN public.video_scripts.is_selected IS 'Whether the user selected this script for their video';
