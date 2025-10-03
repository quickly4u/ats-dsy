# Team Management Fix

## Issue
Team members are not showing up in the Team Management page even though the stats show "Total Members: 1" and "Active Users: 1".

## Root Cause
The `useTeamManagement` hook is trying to join the `users` table with a `user_roles` table that doesn't exist in the database. Additionally, the `team_invitations` table is missing.

## Solution

### Step 1: Apply New Migrations

Run these migrations in order:

```bash
# Option 1: If you have Supabase CLI installed
supabase db push

# Option 2: Manually apply via Supabase Dashboard
# Go to SQL Editor and run each file in order:
```

1. **20251003000401_create_team_invitations_table.sql**
   - Creates the `team_invitations` table
   - Sets up RLS policies
   - Enables invitation tracking

2. **20251003000400_create_user_roles_table.sql**
   - Creates the `user_roles` junction table
   - Links users to their roles
   - Auto-assigns roles from invitations via trigger
   - Adds `department` and `reports_to` columns to `users` table

### Step 2: Assign Roles to Existing Users

For existing users who don't have roles assigned, run this SQL:

```sql
-- First, check if you have roles created
SELECT * FROM roles;

-- If no roles exist, they will be auto-created when you visit the Team page
-- Or manually create them:
INSERT INTO roles (company_id, name, description, permissions, is_active)
VALUES
  ((SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1), 'Owner', 'Full access to all data and settings.', '[]', true),
  ((SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1), 'Manager', 'Manages teams and recruitment.', '[]', true),
  ((SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1), 'Recruiter', 'Manages candidates and applications.', '[]', true);

-- Assign your user to the Owner role
INSERT INTO user_roles (user_id, role_id)
SELECT
  u.id,
  r.id
FROM users u
CROSS JOIN roles r
WHERE u.id = auth.uid()
AND r.name = 'Owner'
AND u.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### Step 3: Verify the Fix

1. Refresh the Team Management page
2. You should now see your user listed in the table
3. The user should have a role assigned
4. Department will default to "General" if not set

### Step 4: Test Inviting New Members

1. Click "Invite User" button
2. Fill in the Basic Info tab (email, first name, last name, phone)
3. Go to Role & Department tab
4. Select a role and department
5. Click "Send Invitation"
6. The new member should appear in the list with "pending" status

## How It Works Now

### Team Member Invitation Flow:

1. **Invite Team Member** → Creates record in `team_invitations` table
2. **User Signs Up** → Auth trigger creates user in `users` table
3. **Auto-Assignment Trigger** → Automatically:
   - Finds matching invitation by email
   - Assigns role via `user_roles` table
   - Updates user's department and reporting structure
   - Marks invitation as "accepted"
4. **Team List Refreshes** → Shows the new team member

### Data Model:

```
users
├─ user_roles (junction table)
│  └─ roles
└─ team_invitations (tracks pending invites)
```

## Troubleshooting

### Issue: Still no team members showing
**Solution**: Check if your user has a role assigned:
```sql
SELECT u.email, r.name as role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.id = auth.uid();
```

If no role is returned, manually assign one using Step 2 above.

### Issue: "Department" shows as blank
**Solution**: Update the user:
```sql
UPDATE users
SET department = 'Engineering' -- or your preferred department
WHERE id = auth.uid();
```

### Issue: New invites don't auto-assign roles
**Solution**: Check if the trigger was created:
```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_name = 'auto_assign_role_on_user_creation';
```

If not found, re-run migration `20251003000400_create_user_roles_table.sql`.

## Testing Checklist

- [ ] Migrations applied successfully
- [ ] Existing users have roles assigned
- [ ] Team members visible in table
- [ ] Can invite new team member
- [ ] Invitation creates pending record
- [ ] Role and department are captured
- [ ] Stats (Total Members, Active Users) match table count

## Additional Notes

- The `department` field was added to the `users` table
- The `reports_to` field creates a hierarchical structure
- Roles are company-specific (multi-tenant safe)
- All tables have RLS policies for security
