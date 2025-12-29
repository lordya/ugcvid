-- Add quality_tier enum to users table
-- This enables differentiation between Standard and Premium video generation tiers

-- Create enum type for quality tiers
CREATE TYPE user_quality_tier AS ENUM ('standard', 'premium');

-- Add quality_tier column to users table with default 'standard'
ALTER TABLE users
ADD COLUMN quality_tier user_quality_tier DEFAULT 'standard' NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN users.quality_tier IS 'Quality tier for video generation: standard (fast/cheap) or premium (high quality/slower)';

-- Create index for potential queries on quality_tier
CREATE INDEX idx_users_quality_tier ON users(quality_tier);
