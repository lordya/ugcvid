-- Migration: Add Social Analytics Columns to Video Posts Table
-- Story 10.1: Social Analytics Polling (The "Ear")

-- ============================================
-- 1. ADD ANALYTICS COLUMNS TO VIDEO_POSTS
-- ============================================

ALTER TABLE public.video_posts
ADD COLUMN view_count integer DEFAULT 0,
ADD COLUMN like_count integer DEFAULT 0,
ADD COLUMN share_count integer DEFAULT 0,
ADD COLUMN analytics_last_updated timestamptz;

-- ============================================
-- 2. ADD INDEXES FOR ANALYTICS QUERIES
-- ============================================

-- Index for efficient analytics updates (posts that need updating)
CREATE INDEX idx_video_posts_analytics_last_updated ON public.video_posts(analytics_last_updated)
WHERE analytics_last_updated IS NOT NULL;

-- Index for finding posts that need analytics updates (published posts without recent analytics)
CREATE INDEX idx_video_posts_status_analytics ON public.video_posts(status, analytics_last_updated)
WHERE status = 'PUBLISHED';

-- Index for analytics queries by platform and recency
CREATE INDEX idx_video_posts_integration_created ON public.video_posts(integration_id, created_at DESC);

-- ============================================
-- 3. ADD COMMENTS
-- ============================================

COMMENT ON COLUMN public.video_posts.view_count IS 'Number of views the social media post has received';
COMMENT ON COLUMN public.video_posts.like_count IS 'Number of likes/reactions the social media post has received';
COMMENT ON COLUMN public.video_posts.share_count IS 'Number of shares/reposts the social media post has received';
COMMENT ON COLUMN public.video_posts.analytics_last_updated IS 'Timestamp when social media analytics were last fetched for this post';

-- ============================================
-- 4. UPDATE RLS POLICIES (IF NEEDED)
-- ============================================

-- Note: Existing RLS policies already cover these columns since they inherit from the table policies
