-- Fix user creation: Auto-create public.users record when auth.users is created
-- Also enable RLS on users table

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user creation
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
    
    INSERT INTO public.companies (name, slug, size, subscription_plan)
    VALUES (
      company_name,
      company_slug,
      company_size,
      'free'
    )
    RETURNING id INTO default_company_id;
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create public.users records for existing auth.users that don't have them
DO $$
DECLARE
  auth_user RECORD;
  new_company_id uuid;
BEGIN
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Create a company for this user
    INSERT INTO public.companies (name, slug, subscription_plan)
    VALUES (
      COALESCE(
        auth_user.raw_user_meta_data->>'first_name' || '''s Company',
        split_part(auth_user.email, '@', 1) || '''s Company'
      ),
      lower(replace(
        COALESCE(
          auth_user.raw_user_meta_data->>'first_name',
          split_part(auth_user.email, '@', 1)
        ) || '-' || substring(auth_user.id::text, 1, 8),
        ' ',
        '-'
      )),
      'free'
    )
    RETURNING id INTO new_company_id;
    
    -- Create user record
    INSERT INTO public.users (
      id,
      company_id,
      email,
      first_name,
      last_name,
      is_active,
      created_at
    )
    VALUES (
      auth_user.id,
      new_company_id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'first_name', split_part(auth_user.email, '@', 1)),
      COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
      true,
      NOW()
    );
    
    RAISE NOTICE 'Created user profile for: %', auth_user.email;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a public.users record and company when a new auth.users record is created';
