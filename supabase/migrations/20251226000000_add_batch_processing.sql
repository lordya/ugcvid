-- Add batch processing tables for bulk video generation
-- Migration: 20251226000000_add_batch_processing.sql

-- Create video_batches table for tracking batch processing jobs
CREATE TABLE video_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_items INTEGER NOT NULL CHECK (total_items > 0 AND total_items <= 50),
  processed_items INTEGER NOT NULL DEFAULT 0 CHECK (processed_items >= 0),
  failed_items INTEGER NOT NULL DEFAULT 0 CHECK (failed_items >= 0),
  total_credits_reserved INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batch_video_items table linking batches to individual videos
CREATE TABLE batch_video_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES video_batches(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  row_index INTEGER NOT NULL CHECK (row_index >= 1),
  url TEXT NOT NULL,
  custom_title TEXT,
  style TEXT DEFAULT 'ugc_auth',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique row_index within a batch
  UNIQUE(batch_id, row_index)
);

-- Create indexes for performance
CREATE INDEX idx_video_batches_user_id ON video_batches(user_id);
CREATE INDEX idx_video_batches_status ON video_batches(status);
CREATE INDEX idx_video_batches_created_at ON video_batches(created_at DESC);
CREATE INDEX idx_batch_video_items_batch_id ON batch_video_items(batch_id);
CREATE INDEX idx_batch_video_items_status ON batch_video_items(status);
CREATE INDEX idx_batch_video_items_video_id ON batch_video_items(video_id);

-- Add RLS policies
ALTER TABLE video_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_video_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own batches
CREATE POLICY "Users can view own video batches" ON video_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video batches" ON video_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video batches" ON video_batches
  FOR UPDATE USING (auth.uid() = user_id);

-- Batch video items policies
CREATE POLICY "Users can view own batch video items" ON batch_video_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM video_batches
      WHERE video_batches.id = batch_video_items.batch_id
      AND video_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own batch video items" ON batch_video_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_batches
      WHERE video_batches.id = batch_video_items.batch_id
      AND video_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own batch video items" ON batch_video_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM video_batches
      WHERE video_batches.id = batch_video_items.batch_id
      AND video_batches.user_id = auth.uid()
    )
  );

-- Admin policies for video_batches
CREATE POLICY "Admins can view all video batches" ON video_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all video batches" ON video_batches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin policies for batch_video_items
CREATE POLICY "Admins can view all batch video items" ON batch_video_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all batch video items" ON batch_video_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update batch progress automatically
CREATE OR REPLACE FUNCTION update_batch_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the batch's processed_items and status based on items
  UPDATE video_batches
  SET
    processed_items = (
      SELECT COUNT(*)
      FROM batch_video_items
      WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
      AND status IN ('completed', 'failed')
    ),
    failed_items = (
      SELECT COUNT(*)
      FROM batch_video_items
      WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
      AND status = 'failed'
    ),
    status = CASE
      WHEN (
        SELECT COUNT(*)
        FROM batch_video_items
        WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
        AND status NOT IN ('completed', 'failed')
      ) = 0 THEN 'completed'
      ELSE 'processing'
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update batch progress when items change
CREATE TRIGGER update_batch_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON batch_video_items
  FOR EACH ROW EXECUTE FUNCTION update_batch_progress();

-- Function to get batch statistics for a user
CREATE OR REPLACE FUNCTION get_batch_statistics(user_uuid UUID)
RETURNS TABLE (
  total_batches BIGINT,
  completed_batches BIGINT,
  processing_batches BIGINT,
  failed_batches BIGINT,
  total_videos_processed BIGINT,
  total_credits_used BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT vb.id) as total_batches,
    COUNT(DISTINCT CASE WHEN vb.status = 'completed' THEN vb.id END) as completed_batches,
    COUNT(DISTINCT CASE WHEN vb.status = 'processing' THEN vb.id END) as processing_batches,
    COUNT(DISTINCT CASE WHEN vb.status = 'failed' THEN vb.id END) as failed_batches,
    COALESCE(SUM(vb.processed_items), 0) as total_videos_processed,
    COALESCE(SUM(vb.total_credits_reserved), 0) as total_credits_used
  FROM video_batches vb
  WHERE vb.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
