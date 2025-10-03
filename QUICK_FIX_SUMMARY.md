# Quick Fix Summary - Team Management Issue

## Problem
Team members not showing in the Team Management table despite stats showing "1 Total Member" and "1 Active User".

## Root Cause
Missing database tables:
- ❌ `user_roles` - Junction table linking users to roles
- ❌ `team_invitations` - Invitation tracking table

## Solution

### Quick Fix (5 minutes):

1. **Apply migrations** via Supabase SQL Editor:
   - Run `supabase/migrations/20251003000401_create_team_invitations_table.sql`
   - Run `supabase/migrations/20251003000400_create_user_roles_table.sql`

2. **Assign role to your user** (run in SQL Editor):
   ```sql
   -- Assign yourself to Owner role
   INSERT INTO user_roles (user_id, role_id)
   SELECT
     u.id,
     r.id
   FROM users u
   CROSS JOIN roles r
   WHERE u.email = 'your-email@example.com'  -- <-- CHANGE THIS
   AND r.name = 'Owner'
   LIMIT 1
   ON CONFLICT DO NOTHING;
   ```

3. **Refresh the page** - Your user should now appear in the table!

## What These Migrations Do

1. **Creates `team_invitations` table** - Tracks who you invite
2. **Creates `user_roles` table** - Links users to their roles
3. **Adds `department` column** - Stores user's department
4. **Adds `reports_to` column** - Creates org hierarchy
5. **Auto-assignment trigger** - Automatically assigns roles when invited users sign up

## Files Created
- ✅ `supabase/migrations/20251003000401_create_team_invitations_table.sql`
- ✅ `supabase/migrations/20251003000400_create_user_roles_table.sql`
- ✅ `TEAM_MANAGEMENT_FIX.md` - Detailed fix instructions
- ✅ `QUICK_FIX_SUMMARY.md` - This file

## Need Help?
See `TEAM_MANAGEMENT_FIX.md` for detailed troubleshooting steps.
