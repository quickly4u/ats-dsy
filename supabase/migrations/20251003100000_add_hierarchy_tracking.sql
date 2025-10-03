-- Add hierarchy tracking fields to core tables
-- This enables data filtering based on reporting hierarchy

-- Add created_by to jobs table (who created the job posting)
ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add created_by to candidates table (who added the candidate)
ALTER TABLE IF EXISTS public.candidates
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add assigned_to to applications table (primary recruiter responsible for this application)
ALTER TABLE IF EXISTS public.applications
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add created_by to applications table (who created the application record)
ALTER TABLE IF EXISTS public.applications
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON public.applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications(created_by);

-- Add phone field to users table if it doesn't exist (needed for team management)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS phone text;

-- Add reports_to field to users table if it doesn't exist (needed for hierarchy)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS reports_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for reports_to lookups
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to);

-- Comments for documentation
COMMENT ON COLUMN public.jobs.created_by IS 'User who created this job posting';
COMMENT ON COLUMN public.candidates.created_by IS 'User who added this candidate to the system';
COMMENT ON COLUMN public.applications.assigned_to IS 'Primary recruiter assigned to this application';
COMMENT ON COLUMN public.applications.created_by IS 'User who created this application record';
COMMENT ON COLUMN public.users.reports_to IS 'Manager this user reports to (for hierarchy)';
