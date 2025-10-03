-- Create user_roles junction table for assigning roles to users
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can view user_roles in their company
CREATE POLICY "Users can view user_roles in their company"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.company_id = u2.company_id
      WHERE u1.id = auth.uid()
      AND u2.id = user_roles.user_id
    )
  );

CREATE POLICY "Users can assign roles in their company"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.company_id = u2.company_id
      WHERE u1.id = auth.uid()
      AND u2.id = user_roles.user_id
    )
  );

CREATE POLICY "Users can update user_roles in their company"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.company_id = u2.company_id
      WHERE u1.id = auth.uid()
      AND u2.id = user_roles.user_id
    )
  );

CREATE POLICY "Users can delete user_roles in their company"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.users u2 ON u1.company_id = u2.company_id
      WHERE u1.id = auth.uid()
      AND u2.id = user_roles.user_id
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Add department column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES public.users(id);

-- Create trigger function to auto-assign role when user is created via invitation
CREATE OR REPLACE FUNCTION assign_role_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's a pending invitation for this user
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE email = NEW.email
  AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If invitation exists, assign the role
  IF FOUND AND invitation_record.role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (NEW.id, invitation_record.role_id, invitation_record.invited_by)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Update user with additional info from invitation
    UPDATE public.users
    SET
      department = COALESCE(NEW.department, 'General'),
      reports_to = invitation_record.reports_to
    WHERE id = NEW.id;

    -- Update invitation status
    UPDATE public.team_invitations
    SET
      status = 'accepted',
      auth_user_id = NEW.id
    WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on users table
DROP TRIGGER IF EXISTS auto_assign_role_on_user_creation ON public.users;
CREATE TRIGGER auto_assign_role_on_user_creation
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_role_from_invitation();
