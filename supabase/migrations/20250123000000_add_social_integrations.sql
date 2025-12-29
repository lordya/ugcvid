-- Migration: Add Social Media Integrations Support
-- Story 9.1: Social Account Linking (OAuth)

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 2. CREATE ENUMS
-- ============================================

-- Social provider enum
CREATE TYPE social_provider AS ENUM (
  'TIKTOK',
  'YOUTUBE',
  'INSTAGRAM'
);

-- ============================================
-- 3. CREATE TABLES
-- ============================================

-- User integrations table for storing OAuth tokens and account info
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider social_provider NOT NULL,
  provider_user_id text NOT NULL, -- Account ID from the provider
  provider_username text, -- Account username/handle for display
  provider_display_name text, -- Account display name for UI
  access_token text NOT NULL, -- Encrypted access token
  refresh_token text, -- Encrypted refresh token (when available)
  token_expires_at timestamptz, -- Token expiration timestamp
  metadata jsonb DEFAULT '{}', -- Additional provider-specific data
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure one integration per user per provider
  UNIQUE(user_id, provider)
);

-- ============================================
-- 4. ENABLE RLS (Row Level Security)
-- ============================================

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY "Users can view own integrations" ON public.user_integrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own integrations
CREATE POLICY "Users can insert own integrations" ON public.user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own integrations
CREATE POLICY "Users can update own integrations" ON public.user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own integrations
CREATE POLICY "Users can delete own integrations" ON public.user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE FUNCTIONS FOR TOKEN ENCRYPTION/DECRYPTION
-- ============================================

-- Function to encrypt sensitive data using Supabase's pgcrypto
-- Note: In production, use proper key management (Vault, environment variables, etc.)
-- This is a placeholder implementation - implement proper key management for production
CREATE OR REPLACE FUNCTION encrypt_token(token_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from environment variable or use a default for development
  -- In production, this should come from a secure key management system
  encryption_key := COALESCE(
    current_setting('app.encryption_key', true),
    'default-dev-key-change-in-production-32chars'
  );

  -- Ensure key is exactly 32 bytes for AES-256
  IF length(encryption_key) != 32 THEN
    RAISE EXCEPTION 'Encryption key must be exactly 32 characters long';
  END IF;

  -- Use pgcrypto's encrypt function with AES
  RETURN encode(encrypt(token_text::bytea, encryption_key::bytea, 'aes'), 'hex');
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from environment variable or use a default for development
  -- In production, this should come from a secure key management system
  encryption_key := COALESCE(
    current_setting('app.encryption_key', true),
    'default-dev-key-change-in-production-32chars'
  );

  -- Ensure key is exactly 32 bytes for AES-256
  IF length(encryption_key) != 32 THEN
    RAISE EXCEPTION 'Encryption key must be exactly 32 characters long';
  END IF;

  -- Use pgcrypto's decrypt function with AES
  RETURN convert_from(decrypt(decode(encrypted_token, 'hex'), encryption_key::bytea, 'aes'), 'utf8');
END;
$$;

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

-- Index for efficient lookups by user and provider
CREATE INDEX idx_user_integrations_user_provider ON public.user_integrations(user_id, provider);

-- Index for token expiration checks (for background refresh jobs)
CREATE INDEX idx_user_integrations_expires_at ON public.user_integrations(token_expires_at);

-- ============================================
-- 7. ADD COMMENTS
-- ============================================

COMMENT ON TABLE public.user_integrations IS 'Stores OAuth integrations for social media platforms (TikTok, YouTube, Instagram)';
COMMENT ON COLUMN public.user_integrations.provider_user_id IS 'The account ID returned by the OAuth provider';
COMMENT ON COLUMN public.user_integrations.provider_username IS 'The username/handle for display purposes';
COMMENT ON COLUMN public.user_integrations.provider_display_name IS 'The display name for UI presentation';
COMMENT ON COLUMN public.user_integrations.access_token IS 'AES-encrypted access token for API calls';
COMMENT ON COLUMN public.user_integrations.refresh_token IS 'AES-encrypted refresh token for token renewal';
COMMENT ON COLUMN public.user_integrations.token_expires_at IS 'When the access token expires and needs refresh';
COMMENT ON COLUMN public.user_integrations.metadata IS 'Additional provider-specific data (profile URLs, scopes, etc.)';

-- ============================================
-- 8. CREATE UPDATED_AT TRIGGER
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
CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
