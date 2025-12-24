-- Migration: Add Performance Trigger
-- Story 10.2: The "Winner" Tagging Logic

-- ============================================
-- 1. TRIGGER FUNCTION TO UPDATE VIDEO PERFORMANCE AFTER ANALYTICS CHANGE
-- ============================================

-- Trigger function that runs after video_posts analytics are updated
CREATE OR REPLACE FUNCTION trigger_update_video_performance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger when analytics data has changed
  IF (OLD.view_count IS DISTINCT FROM NEW.view_count) OR
     (OLD.like_count IS DISTINCT FROM NEW.like_count) OR
     (OLD.share_count IS DISTINCT FROM NEW.share_count) OR
     (OLD.analytics_last_updated IS DISTINCT FROM NEW.analytics_last_updated) THEN

    -- Update performance for the video associated with this post
    -- Use a small delay to avoid too frequent updates (debounce)
    -- In production, consider using a background job queue instead
    PERFORM update_video_performer_status(NEW.video_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 2. CREATE TRIGGER ON VIDEO_POSTS TABLE
-- ============================================

-- Trigger to automatically update video performance when analytics change
DROP TRIGGER IF EXISTS trigger_video_performance_update ON public.video_posts;
CREATE TRIGGER trigger_video_performance_update
  AFTER UPDATE ON public.video_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_video_performance();

-- ============================================
-- 3. TRIGGER TO UPDATE PERFORMANCE WHEN NEW ANALYTICS ARE ADDED
-- ============================================

-- Also trigger when new analytics are inserted (first time analytics)
CREATE OR REPLACE FUNCTION trigger_update_video_performance_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger for published posts with analytics data
  IF NEW.status = 'PUBLISHED' AND
     (NEW.view_count IS NOT NULL OR NEW.like_count IS NOT NULL OR NEW.share_count IS NOT NULL) THEN

    PERFORM update_video_performer_status(NEW.video_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_video_performance_insert ON public.video_posts;
CREATE TRIGGER trigger_video_performance_insert
  AFTER INSERT ON public.video_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_video_performance_insert();

-- ============================================
-- 4. ADD COMMENTS
-- ============================================

COMMENT ON FUNCTION trigger_update_video_performance() IS 'Trigger function to update video performance after analytics changes';
COMMENT ON FUNCTION trigger_update_video_performance_insert() IS 'Trigger function to update video performance when analytics are first added';
COMMENT ON TRIGGER trigger_video_performance_update ON public.video_posts IS 'Automatically updates video performance when analytics are updated';
COMMENT ON TRIGGER trigger_video_performance_insert ON public.video_posts IS 'Automatically updates video performance when analytics are first inserted';
