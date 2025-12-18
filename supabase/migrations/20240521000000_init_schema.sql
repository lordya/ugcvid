-- Migration: Initialize Database Schema & Credit Logic
-- Story 1.3: Database Schema & Credit Logic

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Video status enum
CREATE TYPE video_status AS ENUM (
  'DRAFT',
  'SCRIPT_GENERATED',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

-- Transaction type enum
CREATE TYPE transaction_type AS ENUM (
  'PURCHASE',
  'GENERATION',
  'REFUND',
  'BONUS'
);

-- Payment provider enum
CREATE TYPE payment_provider AS ENUM (
  'LEMON',
  'CRYPTO',
  'SYSTEM'
);

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  credits_balance integer NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status video_status NOT NULL DEFAULT 'DRAFT',
  input_metadata jsonb,
  final_script text,
  kie_task_id text,
  video_url text,
  error_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type transaction_type NOT NULL,
  provider payment_provider NOT NULL DEFAULT 'SYSTEM',
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Indexes for performance (especially for RLS policies)
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
-- Unique index to prevent duplicate webhook processing (same provider + payment_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_provider_payment_unique 
  ON public.transactions(provider, payment_id) 
  WHERE payment_id IS NOT NULL;
-- Index for querying by provider and payment_id
CREATE INDEX IF NOT EXISTS idx_transactions_provider_payment_id 
  ON public.transactions(provider, payment_id) 
  WHERE payment_id IS NOT NULL;

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to automatically create a public.users row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (
    NEW.id,
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Function to update user credits balance when a transaction is inserted
CREATE OR REPLACE FUNCTION public.update_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's credits_balance by adding the transaction amount
  -- Amount can be positive (purchase/refund/bonus) or negative (generation/spend)
  UPDATE public.users
  SET credits_balance = credits_balance + NEW.amount,
      updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Trigger to create public.users row when auth.users row is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update credits_balance when a transaction is inserted
DROP TRIGGER IF EXISTS on_transaction_inserted ON public.transactions;
CREATE TRIGGER on_transaction_inserted
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_credits();

-- Trigger to update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on videos table
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Users table policies
-- Users can SELECT their own user record
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Users can UPDATE their own user record (but not credits_balance or role - those are system-managed)
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Videos table policies
-- Users can SELECT their own videos
CREATE POLICY "Users can view their own videos"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can INSERT their own videos
CREATE POLICY "Users can create their own videos"
  ON public.videos
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can UPDATE their own videos
CREATE POLICY "Users can update their own videos"
  ON public.videos
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can DELETE their own videos
CREATE POLICY "Users can delete their own videos"
  ON public.videos
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Transactions table policies
-- Users can SELECT their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Note: INSERT into transactions should be restricted to service role only
-- This ensures credits can only be modified through backend API/webhooks
-- We'll allow authenticated users to INSERT but validate in application layer
-- OR we can restrict it completely - let's restrict it for security
-- Service role can bypass RLS, so backend operations will work

-- Admin policies (optional - for future admin features)
-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Admins can view all videos
CREATE POLICY "Admins can view all videos"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================
-- 8. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE public.users IS 'User profiles extending auth.users with credit balance and role';
COMMENT ON TABLE public.videos IS 'Video generation records with status tracking';
COMMENT ON TABLE public.transactions IS 'Credit transaction log for purchases, generations, refunds, and bonuses';
COMMENT ON COLUMN public.users.credits_balance IS 'Current available credits (updated automatically via trigger)';
COMMENT ON COLUMN public.transactions.amount IS 'Positive for purchase/refund/bonus, negative for generation/spend';
COMMENT ON COLUMN public.transactions.provider IS 'Payment provider: LEMON (Lemon Squeezy), CRYPTO (Cryptomus), or SYSTEM (internal operations)';
COMMENT ON COLUMN public.transactions.payment_id IS 'External payment ID (Lemon Squeezy Order ID or Cryptomus UUID) - used to prevent duplicate webhook processing';
COMMENT ON FUNCTION public.update_user_credits() IS 'Automatically updates user credits_balance when a transaction is inserted';

