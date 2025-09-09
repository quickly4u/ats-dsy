-- Adjust roles uniqueness to be company-scoped and enable RLS policies
begin;

-- Drop existing unique constraint on roles.name if present
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'roles'
    AND c.contype = 'u'
    AND (
      SELECT array_agg(att.attname ORDER BY att.attnum)
      FROM unnest(c.conkey) AS cols(attnum)
      JOIN pg_attribute att ON att.attrelid = t.oid AND att.attnum = cols.attnum
    ) = ARRAY['name'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.roles DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Create unique index on (company_id, name) when company_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS roles_company_name_unique
ON public.roles (company_id, name)
WHERE company_id IS NOT NULL;

-- Enable RLS and add policies for company-scoped access
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "Select roles for user's company" ON public.roles;
CREATE POLICY "Select roles for user's company" ON public.roles
FOR SELECT
USING (
  is_system = true OR
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = roles.company_id
  )
);

-- Insert policy (allow creating roles only within own company)
DROP POLICY IF EXISTS "Insert roles for user's company" ON public.roles;
CREATE POLICY "Insert roles for user's company" ON public.roles
FOR INSERT
WITH CHECK (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = roles.company_id
  )
);

-- Update policy (allow updating roles only within own company)
DROP POLICY IF EXISTS "Update roles for user's company" ON public.roles;
CREATE POLICY "Update roles for user's company" ON public.roles
FOR UPDATE
USING (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = roles.company_id
  )
)
WITH CHECK (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = roles.company_id
  )
);

commit;
