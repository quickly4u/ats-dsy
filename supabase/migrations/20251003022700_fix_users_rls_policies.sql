-- Fix RLS policies on users table to avoid circular dependencies
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

-- Create new simplified policies

-- Allow users to view their own profile
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO public
USING (auth.uid() = id);

-- Allow users to view other users in their company
-- Using a simpler approach without circular dependency
CREATE POLICY "users_select_company"
ON public.users
FOR SELECT
TO public
USING (
  company_id IN (
    SELECT company_id 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Allow users to update their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow the trigger function to insert new users
-- This is handled by SECURITY DEFINER on the trigger function
CREATE POLICY "users_insert_via_trigger"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);

-- Allow admins to manage users in their company (for future use)
-- This will be useful when you implement user management features
CREATE POLICY "users_admin_manage"
ON public.users
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('Admin', 'Super Admin')
    AND public.users.company_id IN (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  )
);

COMMENT ON POLICY "users_select_own" ON public.users IS 'Allow users to view their own profile';
COMMENT ON POLICY "users_select_company" ON public.users IS 'Allow users to view other users in their company';
COMMENT ON POLICY "users_update_own" ON public.users IS 'Allow users to update their own profile';
COMMENT ON POLICY "users_insert_via_trigger" ON public.users IS 'Allow new user creation via trigger';
COMMENT ON POLICY "users_admin_manage" ON public.users IS 'Allow admins to manage users in their company';
