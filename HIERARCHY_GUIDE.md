# Data Visibility Hierarchy Guide

## Overview

The ATS system implements hierarchy-based data visibility to ensure users only see data relevant to their team and reporting structure. This document explains how the hierarchy works and what data each role can access.

## Role Hierarchy

The system has 6 role levels, from lowest to highest:

1. **Recruiter** (Level 0)
2. **ATL** - Assistant Team Lead (Level 1)
3. **TL** - Team Lead (Level 2)
4. **Manager** (Level 3)
5. **Head** (Level 4)
6. **Owner** (Level 5)

## Reporting Structure

- Each user can have a `reports_to` field pointing to their direct manager
- The `reports_to` field must follow the hierarchy rules:
  - Recruiter can report to: ATL, TL, Manager, Head, or Owner
  - ATL can report to: TL, Manager, Head, or Owner
  - TL can report to: Manager, Head, or Owner
  - Manager can report to: Head or Owner
  - Head can report to: Owner
  - Owner cannot report to anyone

## Data Visibility Rules

### General Principle
- **Owner**: Sees ALL data in the company
- **Head/Manager/TL/ATL**: Sees their own data + all data from their direct and indirect reports
- **Recruiter**: Sees ONLY their own data

### Specific Data Types

#### Jobs
- Users can see jobs created by themselves or any team member they manage (directly or indirectly)
- Field tracked: `created_by` (user who created the job posting)

#### Candidates
- Users can see candidates added by themselves or any team member they manage
- Field tracked: `created_by` (user who added the candidate to the system)

#### Applications
- Users can see applications if:
  - They are assigned to the application (`assigned_to`), OR
  - They created the application record (`created_by`), OR
  - The person assigned/creator is in their reporting hierarchy
- Fields tracked: `assigned_to`, `created_by`

#### Team Members
- Users can see themselves and all team members who report to them (directly or indirectly)
- Field tracked: `reports_to` (builds the reporting tree)

#### Interviews, Contacts, Clients
- These follow the same pattern as applications
- Visibility is determined by the associated user/creator

## Implementation Details

### Database Schema

The following fields have been added to support hierarchy:

```sql
-- users table
ALTER TABLE users ADD COLUMN reports_to uuid REFERENCES users(id);

-- jobs table
ALTER TABLE jobs ADD COLUMN created_by uuid REFERENCES users(id);

-- candidates table
ALTER TABLE candidates ADD COLUMN created_by uuid REFERENCES users(id);

-- applications table
ALTER TABLE applications ADD COLUMN assigned_to uuid REFERENCES users(id);
ALTER TABLE applications ADD COLUMN created_by uuid REFERENCES users(id);
```

### Utility Functions

Location: `src/utils/hierarchy.ts`

Key functions:
- `getAccessibleTeamMemberIds()`: Returns array of user IDs the current user can access
- `getCurrentUserRole()`: Returns the current user's role name
- `canAccessUserData(targetUserId)`: Checks if current user can access specific user's data

### Data Hooks

All main data hooks have been updated to respect hierarchy:

1. **useRecruitmentData.ts**
   - `useJobs`: Filters jobs by `created_by`
   - `useCandidates`: Filters candidates by `created_by`
   - `useApplications`: Filters applications by `assigned_to` or `created_by`

2. **useTeamManagement.ts**
   - Filters team members based on reporting hierarchy

## Legacy Data Handling

For backward compatibility with existing data:
- If `created_by` or `assigned_to` is NULL (legacy records), the data is visible to everyone in the company
- This ensures no data is hidden during the migration period
- **Action Required**: Update existing records to assign proper ownership

## Example Scenarios

### Scenario 1: Recruiter
- **User**: John (Recruiter, reports to Sarah)
- **Can See**:
  - Jobs: Only jobs John created
  - Candidates: Only candidates John added
  - Applications: Only applications John is assigned to or created
  - Team Members: Only John (himself)

### Scenario 2: Team Lead
- **User**: Sarah (TL, manages 3 recruiters: John, Mike, Lisa)
- **Can See**:
  - Jobs: Jobs created by Sarah, John, Mike, or Lisa
  - Candidates: Candidates added by Sarah, John, Mike, or Lisa
  - Applications: Applications assigned to or created by Sarah, John, Mike, or Lisa
  - Team Members: Sarah, John, Mike, Lisa

### Scenario 3: Manager with Nested Reports
- **User**: David (Manager)
  - Reports to: Emma (Head)
  - Direct reports: Sarah (TL), Tom (TL)
  - Indirect reports: John, Mike, Lisa (under Sarah), Amy, Bob (under Tom)
- **Can See**:
  - Jobs: Created by David or anyone in his team (Sarah, Tom, John, Mike, Lisa, Amy, Bob)
  - Candidates: Added by David or anyone in his team
  - Applications: Assigned to or created by David or anyone in his team
  - Team Members: David + all 6 team members

### Scenario 4: Owner
- **User**: Emma (Owner)
- **Can See**: EVERYTHING in the company (all jobs, candidates, applications, team members)

## Testing Hierarchy

To test the hierarchy system:

1. Create users with different roles
2. Set up `reports_to` relationships
3. Create jobs/candidates/applications with `created_by` fields
4. Log in as different users and verify:
   - Owner sees all data
   - Managers see only their team's data
   - Recruiters see only their own data

## Migration Checklist

When deploying hierarchy-based filtering:

- [ ] Run migration: `20251003100000_add_hierarchy_tracking.sql`
- [ ] Update existing data to set `created_by` fields
- [ ] Set up `reports_to` relationships for all users
- [ ] Assign roles to all team members
- [ ] Test with different user roles
- [ ] Monitor for any access issues

## Troubleshooting

### User can't see expected data
1. Check if they have the correct role assigned
2. Verify `reports_to` relationships are set up correctly
3. Check if data has `created_by` or `assigned_to` set
4. Verify the user is in the correct reporting hierarchy

### Owner can't see all data
1. Ensure the user's role is exactly "Owner" (case-sensitive)
2. Check role assignment in `user_roles` table
3. Verify company_id matches

### Data appears for wrong users
1. Check `created_by` and `assigned_to` fields in the database
2. Verify hierarchy utility function is working correctly
3. Review `getAccessibleTeamMemberIds()` output

## Future Enhancements

Potential improvements to the hierarchy system:
- Matrix organization support (multiple managers)
- Temporary delegation of permissions
- Custom visibility rules per data type
- Data sharing between teams
- Audit log for data access
