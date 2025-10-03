-- Migration to auto-assign Owner role when user signs up and creates a new company
-- This ensures the company creator is automatically shown in Team Management

-- Update the signup trigger to also assign the Owner role
CREATE OR REPLACE FUNCTION public.handle_auth_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  md jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  company jsonb := coalesce(md->'company', '{}'::jsonb);
  v_company_id uuid;
  v_company_name text := coalesce(company->>'name', '');
  v_company_slug text := coalesce(company->>'slug', '');
  v_company_size text := company->>'size';
  v_subscription_plan text := coalesce(company->>'subscriptionPlan', 'free');
  v_first_name text := coalesce(md->>'firstName', md->>'first_name');
  v_last_name text := coalesce(md->>'lastName', md->>'last_name');
  v_avatar text := coalesce(md->>'avatar_url', md->>'avatar');
  v_owner_role_id uuid;
  v_is_new_company boolean := false;
BEGIN
  -- derive slug if missing
  if v_company_slug = '' and v_company_name <> '' then
    v_company_slug := regexp_replace(lower(v_company_name), '[^a-z0-9\s-]', '', 'g');
    v_company_slug := regexp_replace(v_company_slug, '\s+', '-', 'g');
    v_company_slug := regexp_replace(v_company_slug, '-+', '-', 'g');
  end if;

  -- upsert company if we have basic details
  if v_company_name <> '' and v_company_slug <> '' then
    -- Check if company already exists
    SELECT id INTO v_company_id FROM public.companies WHERE slug = v_company_slug;
    
    IF v_company_id IS NULL THEN
      -- New company being created
      v_is_new_company := true;
      INSERT INTO public.companies (name, slug, size, subscription_plan)
      VALUES (v_company_name, v_company_slug, v_company_size, v_subscription_plan)
      RETURNING id INTO v_company_id;
    ELSE
      -- Existing company, just update
      UPDATE public.companies
      SET name = v_company_name,
          size = v_company_size,
          subscription_plan = v_subscription_plan,
          updated_at = now()
      WHERE id = v_company_id;
    END IF;
  end if;

  -- create application user profile row
  INSERT INTO public.users (id, company_id, email, first_name, last_name, avatar)
  VALUES (new.id, v_company_id, new.email, v_first_name, v_last_name, v_avatar)
  ON CONFLICT (id) DO NOTHING;

  -- If this is a new company signup, assign Owner role
  IF v_is_new_company AND v_company_id IS NOT NULL THEN
    -- Find or create the Owner role for this company
    SELECT id INTO v_owner_role_id
    FROM public.roles
    WHERE company_id = v_company_id AND name = 'Owner'
    LIMIT 1;

    IF v_owner_role_id IS NULL THEN
      -- Create Owner role
      INSERT INTO public.roles (company_id, name, description, permissions, is_active)
      VALUES (
        v_company_id,
        'Owner',
        'Full access to all data and settings.',
        '[]'::jsonb,
        true
      )
      RETURNING id INTO v_owner_role_id;
    END IF;

    -- Assign Owner role to the new user
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (new.id, v_owner_role_id, new.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Also create a helper function to backfill existing users who don't have roles
-- This is useful for any existing companies where the owner wasn't auto-assigned
CREATE OR REPLACE FUNCTION public.backfill_owner_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  company_record RECORD;
  first_user_id uuid;
  owner_role_id uuid;
BEGIN
  -- For each company that has users but no assigned roles
  FOR company_record IN
    SELECT DISTINCT c.id as company_id, c.name
    FROM public.companies c
    INNER JOIN public.users u ON u.company_id = c.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      INNER JOIN public.users u2 ON u2.id = ur.user_id
      WHERE u2.company_id = c.id
    )
  LOOP
    -- Get the first user of the company (oldest by created_at)
    SELECT u.id INTO first_user_id
    FROM public.users u
    WHERE u.company_id = company_record.company_id
    ORDER BY u.created_at ASC
    LIMIT 1;

    IF first_user_id IS NOT NULL THEN
      -- Find or create Owner role
      SELECT id INTO owner_role_id
      FROM public.roles
      WHERE company_id = company_record.company_id AND name = 'Owner'
      LIMIT 1;

      IF owner_role_id IS NULL THEN
        INSERT INTO public.roles (company_id, name, description, permissions, is_active)
        VALUES (
          company_record.company_id,
          'Owner',
          'Full access to all data and settings.',
          '[]'::jsonb,
          true
        )
        RETURNING id INTO owner_role_id;
      END IF;

      -- Assign Owner role
      INSERT INTO public.user_roles (user_id, role_id, assigned_by)
      VALUES (first_user_id, owner_role_id, first_user_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;

      RAISE NOTICE 'Assigned Owner role to user % for company %', first_user_id, company_record.name;
    END IF;
  END LOOP;
END;
$$;

-- Run the backfill function to fix existing companies
SELECT public.backfill_owner_roles();
