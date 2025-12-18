-- Migration: Add Payment Provider Support to Transactions
-- Story 1.3: Update transactions table to support multiple payment providers
-- Replaces stripe_payment_id with provider enum and payment_id

-- ============================================
-- 1. CREATE PAYMENT PROVIDER ENUM
-- ============================================

CREATE TYPE payment_provider AS ENUM (
  'LEMON',
  'CRYPTO',
  'SYSTEM'
);

-- ============================================
-- 2. ALTER TRANSACTIONS TABLE
-- ============================================

-- Add provider column (default to SYSTEM for existing records and system-generated transactions)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS provider payment_provider NOT NULL DEFAULT 'SYSTEM';

-- Rename stripe_payment_id to payment_id (more generic)
ALTER TABLE public.transactions
  RENAME COLUMN stripe_payment_id TO payment_id;

-- Add index on provider and payment_id for webhook deduplication queries
CREATE INDEX IF NOT EXISTS idx_transactions_provider_payment_id 
  ON public.transactions(provider, payment_id) 
  WHERE payment_id IS NOT NULL;

-- Add unique constraint on provider + payment_id to prevent duplicate webhook processing
-- This ensures we can't process the same Lemon Squeezy Order ID or Cryptomus UUID twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_provider_payment_unique
  ON public.transactions(provider, payment_id)
  WHERE payment_id IS NOT NULL;

-- ============================================
-- 3. UPDATE COMMENTS
-- ============================================

COMMENT ON COLUMN public.transactions.provider IS 'Payment provider: LEMON (Lemon Squeezy), CRYPTO (Cryptomus), or SYSTEM (internal operations)';
COMMENT ON COLUMN public.transactions.payment_id IS 'External payment ID (Lemon Squeezy Order ID or Cryptomus UUID) - used to prevent duplicate webhook processing';

