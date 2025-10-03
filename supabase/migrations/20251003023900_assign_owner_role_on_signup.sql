-- Update the user creation trigger to create default roles and assign Owner role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id uuid;
  user_email text;
  user_first_name text;
  user_last_name text;
  user_phone text;
  company_name text;
  company_slug text;
  company_size text;
  owner_role_id uuid;
BEGIN
  -- Extract email from new auth user
  user_email := NEW.email;
  
  -- Try to extract first and last name from raw_user_meta_data
  -- Support both camelCase (firstName) and snake_case (first_name)
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'first_name',
    split_part(user_email, '@', 1)
  );
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'last_name',
    ''
  );
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  -- Check if user already exists in public.users (shouldn't happen, but safety check)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Get or create a default company for this user
  -- First, check if there's a company_id in metadata (from invitation)
  default_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  
  -- If no company in metadata, create a new company for this user
  IF default_company_id IS NULL THEN
    -- Extract company details from metadata if available
    company_name := COALESCE(
      NEW.raw_user_meta_data->'company'->>'name',
      user_first_name || '''s Company'
    );
    company_slug := COALESCE(
      NEW.raw_user_meta_data->'company'->>'slug',
      lower(replace(user_first_name || '-' || substring(NEW.id::text, 1, 8), ' ', '-'))
    );
    company_size := NEW.raw_user_meta_data->'company'->>'size';
    
    -- Create company
    INSERT INTO public.companies (name, slug, size, subscription_plan)
    VALUES (
      company_name,
      company_slug,
      company_size,
      'free'
    )
    RETURNING id INTO default_company_id;
    
    -- Create default roles for the new company
    -- Owner role
    INSERT INTO public.roles (company_id, name, description, is_system, permissions, is_active)
    VALUES (
      default_company_id,
      'Owner',
      'Full access to all data and settings.',
      false,
      '["all"]'::jsonb,
      true
    )
    RETURNING id INTO owner_role_id;
    
    -- Admin role
    INSERT INTO public.roles (company_id, name, description, is_system, permissions, is_active)
    VALUES (
      default_company_id,
      'Admin',
      'Administrative access to manage users and settings.',
      false,
      '["manage_users", "manage_settings", "view_all"]'::jsonb,
      true
    );
    
    -- Manager role
    INSERT INTO public.roles (company_id, name, description, is_system, permissions, is_active)
    VALUES (
      default_company_id,
      'Manager',
      'Manages teams and their operations.',
      false,
      '["manage_team", "view_reports"]'::jsonb,
      true
    );
    
    -- Recruiter role
    INSERT INTO public.roles (company_id, name, description, is_system, permissions, is_active)
    VALUES (
      default_company_id,
      'Recruiter',
      'Manages candidates and applications.',
      false,
      '["manage_candidates", "manage_applications"]'::jsonb,
      true
    );
    
  ELSE
    -- User is joining an existing company (via invitation)
    -- Get the default role for invited users (e.g., Recruiter)
    SELECT id INTO owner_role_id
    FROM public.roles
    WHERE company_id = default_company_id
    AND name = 'Recruiter'
    LIMIT 1;
  END IF;
  
  -- Insert user into public.users table
  INSERT INTO public.users (
    id,
    company_id,
    email,
    first_name,
    last_name,
    phone,
    is_active,
    created_at
  )
  VALUES (
    NEW.id,
    default_company_id,
    user_email,
    user_first_name,
    user_last_name,
    user_phone,
    true,
    NOW()
  );
  
  -- Assign role to user (Owner if they created company, Recruiter if invited)
  IF owner_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_at)
    VALUES (NEW.id, owner_role_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile, company, default roles, and assigns Owner role to company creator';

-- Manually assign Owner role to existing user
DO $$
DECLARE
  v_user_id uuid := 'a0267225-ba77-420b-bdcd-aa674053e14b';
  v_company_id uuid := 'b07d3df5-bd09-4580-af80-7a8be96afbf2';
  v_owner_role_id uuid;
BEGIN
  -- Get or create Owner role
  SELECT id INTO v_owner_role_id
  FROM public.roles
  WHERE company_id = v_company_id
  AND name = 'Owner'
  LIMIT 1;
  
  -- If Owner role exists and user doesn't have it, assign it
  IF v_owner_role_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role_id = v_owner_role_id
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_at)
    VALUES (v_user_id, v_owner_role_id, NOW());
    
    RAISE NOTICE 'Assigned Owner role to user %', v_user_id;
  END IF;
END $$;
