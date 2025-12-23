-- Migration: Add KIE_AI to payment_provider enum
-- Story: Kie.ai Model Optimization - Add Kie.ai as a provider type

-- Add KIE_AI to payment_provider enum
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'KIE_AI';

-- Comment on the new provider value
COMMENT ON TYPE payment_provider IS 'Payment provider: LEMON (Lemon Squeezy), CRYPTO (Cryptomus), SYSTEM (internal operations), KIE_AI (Kie.ai video generation)';

