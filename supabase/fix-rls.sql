-- Run this in Supabase SQL Editor
-- Fixes profile reads being blocked after login

-- Drop the existing policy that requires auth.uid() match
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- Allow any authenticated user to read any profile
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Also ensure the anon role can read profiles (needed during session init)
CREATE POLICY "profiles_select_anon" ON profiles
  FOR SELECT
  TO anon
  USING (true);
