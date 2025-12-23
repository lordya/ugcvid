-- Migration: Add metadata column to transactions table
-- Story: Kie.ai Model Optimization - Track model selection and costs

-- Add metadata column to transactions table for storing model info, costs, etc.
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Index for querying by model (for analytics and cost tracking)
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_model 
ON public.transactions USING GIN ((metadata->>'model'));

-- Index for querying by format (for analytics)
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_format 
ON public.transactions USING GIN ((metadata->>'format'));

-- Comment on metadata column
COMMENT ON COLUMN public.transactions.metadata IS 'JSON metadata for transaction details (model, format, costs, etc.)';

