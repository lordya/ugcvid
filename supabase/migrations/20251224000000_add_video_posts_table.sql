-- Migration: Add Video Posts Table for Social Media Publishing Status
-- Story 9.3: Publication Queue & Status

-- ============================================
-- 1. CREATE ENUM FOR VIDEO POST STATUS
-- ============================================

CREATE TYPE video_post_status AS ENUM (
  'PENDING',     -- Post is queued/being processed
  'PUBLISHED',   -- Successfully published to platform
  'FAILED'       -- Failed to publish (with error_message)
);

-- ============================================
-- 2. CREATE VIDEO_POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.video_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  external_post_id text, -- The post ID returned by the social platform API
  status video_post_status NOT NULL DEFAULT 'PENDING',
  error_message text, -- Error details if status is 'FAILED'
  posted_at timestamptz, -- When the post was successfully published
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure one post record per video per integration
  UNIQUE(video_id, integration_id)
);

-- ============================================
-- 3. ENABLE RLS (Row Level Security)
-- ============================================

ALTER TABLE public.video_posts ENABLE ROW LEVEL SECURITY;

-- Users can only see video_posts for videos they own
CREATE POLICY "Users can view own video posts" ON public.video_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_posts.video_id
      AND v.user_id = auth.uid()
    )
  );

-- Users can only insert video_posts for videos they own
CREATE POLICY "Users can insert own video posts" ON public.video_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_posts.video_id
      AND v.user_id = auth.uid()
    )
  );

-- Users can only update video_posts for videos they own
CREATE POLICY "Users can update own video posts" ON public.video_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_posts.video_id
      AND v.user_id = auth.uid()
    )
  );

-- Users can only delete video_posts for videos they own
CREATE POLICY "Users can delete own video posts" ON public.video_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_posts.video_id
      AND v.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

-- Index for efficient lookups by video_id
CREATE INDEX idx_video_posts_video_id ON public.video_posts(video_id);

-- Index for efficient lookups by integration_id
CREATE INDEX idx_video_posts_integration_id ON public.video_posts(integration_id);

-- Index for efficient lookups by status (for admin queries or cleanup jobs)
CREATE INDEX idx_video_posts_status ON public.video_posts(status);

-- Index for posted_at queries (for sorting published posts by date)
CREATE INDEX idx_video_posts_posted_at ON public.video_posts(posted_at);

-- ============================================
-- 5. ADD COMMENTS
-- ============================================

COMMENT ON TABLE public.video_posts IS 'Tracks social media publishing status for videos across different platforms';
COMMENT ON COLUMN public.video_posts.video_id IS 'Reference to the video being posted';
COMMENT ON COLUMN public.video_posts.integration_id IS 'Reference to the user integration used for posting';
COMMENT ON COLUMN public.video_posts.external_post_id IS 'The post ID returned by the social platform API';
COMMENT ON COLUMN public.video_posts.status IS 'Current status of the social media post';
COMMENT ON COLUMN public.video_posts.error_message IS 'Error details if the post failed to publish';
COMMENT ON COLUMN public.video_posts.posted_at IS 'Timestamp when the post was successfully published to the platform';

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_video_posts_updated_at
    BEFORE UPDATE ON public.video_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
