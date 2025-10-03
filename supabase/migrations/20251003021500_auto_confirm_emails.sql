-- Auto-confirm email addresses on signup (for development)
-- This trigger will automatically confirm user emails when they sign up

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the email if it's not already confirmed
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmation_sent_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- Also confirm any existing unconfirmed users
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmation_sent_at = COALESCE(confirmation_sent_at, NOW())
WHERE email_confirmed_at IS NULL;

COMMENT ON FUNCTION public.auto_confirm_user() IS 'Automatically confirms user email addresses on signup for development purposes';
