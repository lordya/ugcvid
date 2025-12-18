-- Migration: Add User Profile Fields
-- Story 5.3: User Settings & Account Management

-- Add preferences JSONB column (default empty object)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}';

-- Add display_name column (nullable, can be synced from auth.users or set manually)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name text;

-- Add avatar_url column (nullable, stores Supabase Storage path)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.users.preferences IS 'User preferences stored as JSONB (e.g., email_notifications: boolean)';
COMMENT ON COLUMN public.users.display_name IS 'User display name (can be synced from auth.users or set manually)';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image stored in Supabase Storage avatars bucket';

-- NOTE: After running this migration, you need to create a Supabase Storage bucket named 'avatars':
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named 'avatars'
-- 3. Set it to Public (or configure RLS policies to allow authenticated users to upload/read)
-- 4. Recommended RLS policy for authenticated users:
--    - INSERT: authenticated users can upload to their own folder (avatars/{user_id}/*)
--    - SELECT: authenticated users can read all avatars (or restrict to their own)
--    - UPDATE/DELETE: authenticated users can only modify their own files

