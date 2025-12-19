-- Migration: Fix Infinite Recursion in Admin RLS Policies
-- 
-- Problem: Admin RLS policies were querying the users table to check if a user is an admin,
-- which caused infinite recursion when evaluating the policy itself.
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check admin status,
-- then update all admin policies to use this function.

-- ============================================
-- 1. CREATE HELPER FUNCTION TO CHECK ADMIN STATUS
-- ============================================

-- Function to check if the current user is an admin
-- Uses SECURITY DEFINER to bypass RLS when checking the role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the current user, bypassing RLS
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- Return true if role is 'admin', false otherwise
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- ============================================
-- 2. DROP OLD ADMIN POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- ============================================
-- 3. CREATE NEW ADMIN POLICIES USING THE HELPER FUNCTION
-- ============================================

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can view all videos
CREATE POLICY "Admins can view all videos"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- 4. COMMENTS
-- ============================================

COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current authenticated user has admin role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

