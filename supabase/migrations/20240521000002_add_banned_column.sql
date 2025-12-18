-- Migration: Add banned column to users table
-- Story 4.1: Admin Content Moderation

-- Add banned column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- Add index for efficient querying of banned users
CREATE INDEX IF NOT EXISTS idx_users_banned ON public.users(banned) WHERE banned = true;

-- Add comment
COMMENT ON COLUMN public.users.banned IS 'Whether the user has been banned by an admin';

