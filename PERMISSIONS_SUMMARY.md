# Hierarchy & Permissions Implementation Summary

## Overview

Implemented a complete hierarchy-based access control system for the ATS with role-based permissions and data visibility.

## ✅ What Has Been Implemented

### 1. **Team Member Edit Form Fix** ✓
- **File**: [src/components/forms/TeamMemberForm.tsx](src/components/forms/TeamMemberForm.tsx)
- **Issue**: Form opened empty when editing team members
- **Solution**: Added `useEffect` to update form data when `editingMember` prop changes
- **Lines**: 59-88

### 2. **Hierarchy Utility** ✓
- **File**: [src/utils/hierarchy.ts](src/utils/hierarchy.ts)
- **Features**:
  - Role hierarchy definition (Recruiter → ATL → TL → Manager → Head → Owner)
  - Permission constants for different features
  - `getAccessibleTeamMemberIds()` - Returns all user IDs current user can see
  - `getCurrentUserRole()` - Gets current user's role
  - `hasPermission()` - Checks if user has specific permission
  - `getCreatableRoles()` - Returns roles user can create (own level & below)
  - `canCreateRole()` - Validates if user can create specific role
  - `canAccessUserData()` - Checks access to specific user's data

### 3. **Data Filtering by Hierarchy** ✓

#### Jobs, Candidates, Applications
- **File**: [src/hooks/useRecruitmentData.ts](src/hooks/useRecruitmentData.ts)
- **Filtering**:
  - Jobs: Filtered by `created_by`
  - Candidates: Filtered by `created_by`
  - Applications: Filtered by `assigned_to` OR `created_by`
- **Logic**: Only show data created/assigned to users in accessible hierarchy

#### Team Members
- **File**: [src/hooks/useTeamManagement.ts](src/hooks/useTeamManagement.ts)
- **Filtering**: Users only see team members in their reporting hierarchy

### 4. **Team Management UI Permissions** ✓
- **File**: [src/components/team/TeamList.tsx](src/components/team/TeamList.tsx)
- **Changes**:
  - "Invite User" button: Only visible to Manager+ (line 223-231)
  - Edit/Delete actions: Only visible to Manager+ (line 348-380)
  - Non-managers see "View Only" text instead of action buttons

### 5. **Role Creation Restrictions** ✓
- **File**: [src/components/forms/TeamMemberForm.tsx](src/components/forms/TeamMemberForm.tsx)
- **Changes**:
  - Fetches creatable roles based on current user's role (line 49-51)
  - Filters role dropdown to show only creatable roles (line 54-57, 339-347)
  - Shows helper text: "You can only create roles at your level or below"

### 6. **Database Migration** ✓
- **File**: [supabase/migrations/20251003100000_add_hierarchy_tracking.sql](supabase/migrations/20251003100000_add_hierarchy_tracking.sql)
- **Schema Changes**:
  ```sql
  - jobs.created_by (uuid) - Who created the job
  - candidates.created_by (uuid) - Who added the candidate
  - applications.assigned_to (uuid) - Primary recruiter for application
  - applications.created_by (uuid) - Who created the application
  - users.phone (text) - Phone number field
  - users.reports_to (uuid) - Manager user reports to
  - Indexes on all new foreign key columns
  ```

### 7. **Documentation** ✓
- [HIERARCHY_GUIDE.md](HIERARCHY_GUIDE.md) - Complete system documentation
- [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md) - Manual migration steps
- [PERMISSIONS_SUMMARY.md](PERMISSIONS_SUMMARY.md) - This file

## Permission Rules Implemented

### Data Visibility
| Role | Can See |
|------|---------|
| **Owner** | ALL company data |
| **Head** | Their team's data (all subordinates) |
| **Manager** | Their team's data (all subordinates) |
| **TL** | Their team's data (all subordinates) |
| **ATL** | Their team's data (all subordinates) |
| **Recruiter** | ONLY their own data |

### Client Access
| Permission | Roles |
|------------|-------|
| View Clients | Manager, Head, Owner |
| Edit Clients | Manager, Head, Owner |

**Note**: TL, ATL, Recruiter **CANNOT** see or access clients

### Team Management
| Permission | Roles |
|------------|-------|
| View Team | All roles (hierarchy-filtered) |
| Invite Users | Manager, Head, Owner |
| Edit Team Members | Manager, Head, Owner |
| Create Roles | Own level & below only |

**Examples**:
- Manager can create: Manager, TL, ATL, Recruiter (not Head or Owner)
- TL can create: TL, ATL, Recruiter
- Recruiter can create: Recruiter only

### Reporting Structure
| Role | Can Report To |
|------|---------------|
| **Owner** | Nobody |
| **Head** | Owner |
| **Manager** | Head, Owner |
| **TL** | Manager, Head, Owner |
| **ATL** | TL, Manager, Head, Owner |
| **Recruiter** | ATL, TL, Manager, Head, Owner |

## How It Works

### Data Flow

1. **User logs in** → System identifies user and their role
2. **Page loads** → `getAccessibleTeamMemberIds()` called
3. **Hierarchy calculated**:
   - Owner → Returns all user IDs in company
   - Manager/Head/TL/ATL → Returns self + all subordinates (recursive)
   - Recruiter → Returns only their own ID
4. **Data filtered** → Only records with `created_by`/`assigned_to` in accessible IDs are shown
5. **UI adjusted** → Buttons/features hidden based on permissions

### Example Scenarios

#### Scenario 1: Recruiter (Bob)
```
Reports to: Manager (Sarah)
Can see:
- Jobs: Only jobs Bob created
- Candidates: Only candidates Bob added
- Applications: Only applications assigned to Bob
- Team: Only Bob himself
- Clients: ❌ CANNOT ACCESS
Actions:
- Cannot invite users
- Cannot edit team members
- Can only create "Recruiter" role users
```

#### Scenario 2: Manager (Sarah)
```
Reports to: Head (David)
Team: TL (John), Recruiters (Bob, Alice, Carol)
Can see:
- Jobs: Created by Sarah, John, Bob, Alice, or Carol
- Candidates: Added by anyone in her team
- Applications: Assigned to anyone in her team
- Team: Sarah + her 4 team members
- Clients: ✅ FULL ACCESS
Actions:
- Can invite new users
- Can edit team members in her hierarchy
- Can create roles: Manager, TL, ATL, Recruiter (NOT Head or Owner)
```

#### Scenario 3: Owner (Emma)
```
Can see: EVERYTHING in the company
Actions:
- Full team management
- Can create any role
- Full client access
- Sees all data from all users
```

## Migration Status

### ⚠️ Migration Pending
The database migration needs to be applied manually:

1. **Apply SQL**: Run migration in Supabase dashboard (see [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md))
2. **Set up hierarchy**: Assign `reports_to` for all users in Team Management UI
3. **Assign roles**: Ensure all users have proper roles
4. **Test**: Verify permissions work correctly

### Legacy Data
- Records with `NULL` in `created_by`/`assigned_to` fields are visible to everyone
- This ensures backward compatibility
- Optionally backfill with owner/admin user ID

## Files Modified

### Core System Files
1. `src/utils/hierarchy.ts` - NEW - Hierarchy logic & permissions
2. `src/hooks/useRecruitmentData.ts` - MODIFIED - Data filtering
3. `src/hooks/useTeamManagement.ts` - MODIFIED - Team member filtering

### UI Components
4. `src/components/team/TeamList.tsx` - MODIFIED - Permission-based UI
5. `src/components/forms/TeamMemberForm.tsx` - MODIFIED - Role restrictions & form fix

### Database
6. `supabase/migrations/20251003100000_add_hierarchy_tracking.sql` - NEW - Schema changes

### Documentation
7. `HIERARCHY_GUIDE.md` - NEW - System documentation
8. `MIGRATION_INSTRUCTIONS.md` - NEW - Migration guide
9. `PERMISSIONS_SUMMARY.md` - NEW - This file

## Testing Checklist

- [ ] Run migration SQL in Supabase
- [ ] Create test users with different roles
- [ ] Set up `reports_to` relationships
- [ ] Test as Owner - should see all data
- [ ] Test as Manager - should see team's data only
- [ ] Test as Recruiter - should see only own data
- [ ] Verify "Invite User" button hidden for Recruiter/TL/ATL
- [ ] Verify edit actions hidden for non-managers
- [ ] Try creating higher-level role as Manager (should be restricted)
- [ ] Verify clients hidden for Recruiter/TL/ATL
- [ ] Test hierarchy tree with nested reports

## Next Steps

1. **Apply Migration** - Run the SQL in Supabase dashboard
2. **Configure Hierarchy** - Set up `reports_to` for existing users
3. **Test Thoroughly** - Verify permissions work as expected
4. **Monitor** - Watch for any access issues
5. **Backfill** (Optional) - Update `created_by` on legacy data

## Support

For issues or questions:
- Review [HIERARCHY_GUIDE.md](HIERARCHY_GUIDE.md) for detailed documentation
- Check [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md) for setup steps
- Verify database schema with provided SQL queries

---

**Last Updated**: 2025-10-03
**Status**: ✅ Code Complete | ⚠️ Migration Pending