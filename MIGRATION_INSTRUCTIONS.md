# How to Apply Hierarchy Tracking Migration

Since Supabase CLI access isn't available, follow these steps to manually apply the migration.

## Step 1: Apply the Migration in Supabase Dashboard

1. Go to your Supabase project: https://jivccjpzcecljzuzxxhx.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Add hierarchy tracking fields to core tables

-- Add created_by to jobs table (who created the job posting)
ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add created_by to candidates table (who added the candidate)
ALTER TABLE IF EXISTS public.candidates
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add assigned_to to applications table (primary recruiter responsible)
ALTER TABLE IF EXISTS public.applications
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add created_by to applications table (who created the application)
ALTER TABLE IF EXISTS public.applications
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add phone field to users table (if not exists)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS phone text;

-- Add reports_to field to users table (for hierarchy)
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS reports_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON public.applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications(created_by);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to);

-- Add comments for documentation
COMMENT ON COLUMN public.jobs.created_by IS 'User who created this job posting';
COMMENT ON COLUMN public.candidates.created_by IS 'User who added this candidate to the system';
COMMENT ON COLUMN public.applications.assigned_to IS 'Primary recruiter assigned to this application';
COMMENT ON COLUMN public.applications.created_by IS 'User who created this application record';
COMMENT ON COLUMN public.users.reports_to IS 'Manager this user reports to (for hierarchy)';
```

5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. Verify the output says "Success. No rows returned"

## Step 2: Backfill Existing Data (Optional)

To assign existing data to the appropriate users, run this SQL:

```sql
-- Get the current authenticated user's ID (you'll need to replace this)
-- Find your user ID first by running:
-- SELECT id, email FROM public.users;

-- Then use that ID in the following updates:

-- Example: Set all existing jobs to be created by the first admin user
-- UPDATE public.jobs
-- SET created_by = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
-- WHERE created_by IS NULL;

-- Example: Set all existing candidates to be created by the first admin user
-- UPDATE public.candidates
-- SET created_by = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
-- WHERE created_by IS NULL;

-- Example: Set all existing applications to be created by the first admin user
-- UPDATE public.applications
-- SET created_by = (SELECT id FROM public.users ORDER BY created_at LIMIT 1),
--     assigned_to = (SELECT id FROM public.users ORDER BY created_at LIMIT 1)
-- WHERE created_by IS NULL;
```

**Note:** You can skip this step if you want legacy data to remain visible to everyone (NULL values = visible to all).

## Step 3: Set Up Reporting Structure

Now go to your ATS application and set up the reporting hierarchy:

1. Log in to your ATS: http://localhost:5173 (or your production URL)
2. Navigate to **Team Management**
3. For each team member:
   - Click **Edit**
   - Go to the **Role & Reporting** tab
   - Select their manager in the **Reports To** dropdown
   - Click **Update Member**

### Example Hierarchy Setup

```
Owner (Emma)
  └─ Head (David)
       ├─ Manager (Sarah)
       │    ├─ TL (John)
       │    │    ├─ ATL (Alice)
       │    │    │    └─ Recruiter (Bob)
       │    │    └─ Recruiter (Carol)
       │    └─ Recruiter (Dave)
       └─ Manager (Tom)
            └─ Recruiter (Eve)
```

## Step 4: Verify the Migration

### Check Columns Were Added

Run this SQL in Supabase SQL Editor:

```sql
-- Check jobs table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'jobs'
  AND column_name = 'created_by';

-- Check candidates table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'candidates'
  AND column_name = 'created_by';

-- Check applications table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'applications'
  AND column_name IN ('created_by', 'assigned_to');

-- Check users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('reports_to', 'phone');
```

### Check Indexes Were Created

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%_created_by'
   OR indexname LIKE 'idx_%_assigned_to'
   OR indexname LIKE 'idx_%_reports_to';
```

## Step 5: Test Hierarchy Filtering

1. Create test users with different roles (if not already existing)
2. Set up reports_to relationships
3. Create test data (jobs, candidates, applications) as different users
4. Log in as each user and verify they see only their team's data:
   - **Owner**: Should see everything
   - **Manager**: Should see their team's data only
   - **Recruiter**: Should see only their own data

### Test Queries

Run these as different users to verify filtering:

```sql
-- As Owner (should return all)
SELECT COUNT(*) FROM public.jobs;

-- As Manager (should return only their team's jobs)
SELECT COUNT(*) FROM public.jobs WHERE created_by IN (
  -- Get accessible user IDs
  SELECT id FROM public.users
  WHERE id = auth.uid()
     OR reports_to = auth.uid()
);
```

## Troubleshooting

### Error: "column already exists"
This is fine - it means the migration was already applied. Continue to the next step.

### Error: "permission denied"
Make sure you're using the SQL Editor in Supabase dashboard, not the client application.

### Data not filtering correctly
1. Check that `created_by` fields are populated
2. Verify `reports_to` relationships are set up correctly
3. Check user roles are assigned properly
4. Review the hierarchy utility function in `src/utils/hierarchy.ts`

## Complete Setup Checklist

- [ ] Run migration SQL in Supabase dashboard
- [ ] Verify columns were added (Step 4)
- [ ] Verify indexes were created (Step 4)
- [ ] Set up reporting structure in Team Management UI
- [ ] Assign roles to all team members (Owner, Head, Manager, TL, ATL, Recruiter)
- [ ] (Optional) Backfill existing data with created_by values
- [ ] Test hierarchy filtering with different user roles
- [ ] Monitor application for any access issues

## Next Steps After Migration

1. **For new data**: The application will automatically set `created_by` when creating jobs/candidates/applications
2. **For existing data**: You can either:
   - Leave it as NULL (visible to everyone) until users edit it
   - Backfill manually using the SQL in Step 2
   - Gradually update as users interact with records

## Questions or Issues?

- Review [HIERARCHY_GUIDE.md](./HIERARCHY_GUIDE.md) for detailed documentation
- Check the implementation in:
  - `src/utils/hierarchy.ts` - Core hierarchy logic
  - `src/hooks/useRecruitmentData.ts` - Data filtering
  - `src/hooks/useTeamManagement.ts` - Team member filtering