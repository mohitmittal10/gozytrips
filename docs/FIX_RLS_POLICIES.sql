-- ============================================
-- FIX ROW LEVEL SECURITY POLICIES
-- ============================================
-- This script fixes the RLS policies for the itineraries table
-- to properly check the authenticated user

-- First, disable all existing policies on itineraries table
ALTER TABLE itineraries DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (this keeps the table secure but clears policies)
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own itineraries
CREATE POLICY "Users can view their own itineraries"
  ON itineraries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own itineraries
CREATE POLICY "Users can insert their own itineraries"
  ON itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own itineraries
CREATE POLICY "Users can update their own itineraries"
  ON itineraries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own itineraries
CREATE POLICY "Users can delete their own itineraries"
  ON itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies are created
SELECT * FROM pg_policies WHERE tablename = 'itineraries';
