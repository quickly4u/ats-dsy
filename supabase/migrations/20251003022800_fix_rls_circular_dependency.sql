-- Fix circular dependency in RLS policies by using a helper function

-- Create a helper function to get current user's company_id
-- SECURITY DEFINER allows it to bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id 
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "users_select_company" ON public.users;

-- Recreate it using the helper function
CREATE POLICY "users_select_company"
ON public.users
FOR SELECT
TO public
USING (company_id = public.get_current_user_company_id());

-- Also update the admin policy to use the helper function
DROP POLICY IF EXISTS "users_admin_manage" ON public.users;

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
  )
  AND company_id = public.get_current_user_company_id()
);

COMMENT ON FUNCTION public.get_current_user_company_id() IS 'Helper function to get current user company_id, bypassing RLS';
