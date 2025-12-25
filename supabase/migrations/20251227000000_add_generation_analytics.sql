-- Migration: Add generation_analytics table for tracking video generation metrics
-- Story: Video Generation Analytics & Monitoring

-- Create generation_analytics table
CREATE TABLE IF NOT EXISTS generation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  model TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  cost_credits INTEGER NOT NULL,
  cost_usd NUMERIC(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_reason TEXT,
  generation_time_seconds INTEGER, -- Time from creation to completion
  retry_count INTEGER DEFAULT 0, -- Number of retries attempted
  circuit_breaker_state TEXT -- State of circuit breaker at generation time
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_format_model ON generation_analytics(format, model);
CREATE INDEX IF NOT EXISTS idx_analytics_status ON generation_analytics(status);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON generation_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_video_id ON generation_analytics(video_id);

-- Add comment for documentation
COMMENT ON TABLE generation_analytics IS 'Tracks video generation metrics for analytics and monitoring';
COMMENT ON COLUMN generation_analytics.format IS 'Video format (e.g., ugc_auth_30s)';
COMMENT ON COLUMN generation_analytics.model IS 'Kie.ai model used (e.g., sora2, wan-2.6)';
COMMENT ON COLUMN generation_analytics.duration IS 'Video duration in seconds (10 or 30)';
COMMENT ON COLUMN generation_analytics.status IS 'Final status of generation';
COMMENT ON COLUMN generation_analytics.generation_time_seconds IS 'Time from creation to completion in seconds';
COMMENT ON COLUMN generation_analytics.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN generation_analytics.circuit_breaker_state IS 'Circuit breaker state at time of generation';

