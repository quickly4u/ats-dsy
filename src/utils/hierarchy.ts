import { supabase, getCurrentUserCompanyId } from '../lib/supabase';

/**
 * Role hierarchy (from lowest to highest):
 * Recruiter < ATL < TL < Manager < Head < Owner
 */
export const ROLE_HIERARCHY = {
  Recruiter: 0,
  ATL: 1,
  TL: 2,
  Manager: 3,
  Head: 4,
  Owner: 5,
} as const;

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Permission levels for different features
 */
export const PERMISSIONS = {
  // Client management - only Manager and above
  CAN_VIEW_CLIENTS: ['Manager', 'Head', 'Owner'],
  CAN_EDIT_CLIENTS: ['Manager', 'Head', 'Owner'],

  // Team management - only Manager and above can add/edit team members
  CAN_MANAGE_TEAM: ['Manager', 'Head', 'Owner'],
  CAN_INVITE_USERS: ['Manager', 'Head', 'Owner'],
  CAN_EDIT_TEAM_MEMBERS: ['Manager', 'Head', 'Owner'],

  // Viewing team - everyone can see their hierarchy
  CAN_VIEW_TEAM: ['Recruiter', 'ATL', 'TL', 'Manager', 'Head', 'Owner'],
} as const;

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: keyof typeof PERMISSIONS): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return PERMISSIONS[permission].includes(role);
}

/**
 * Get roles that can be created by the current user
 * Users can only create roles at their level or below
 */
export async function getCreatableRoles(): Promise<RoleName[]> {
  const currentRole = await getCurrentUserRole();
  if (!currentRole) return [];

  const currentLevel = ROLE_HIERARCHY[currentRole];

  // Get all roles at current level or below
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level <= currentLevel)
    .map(([roleName, _]) => roleName as RoleName);
}

/**
 * Check if current user can create a user with the specified role
 */
export async function canCreateRole(targetRole: RoleName): Promise<boolean> {
  const currentRole = await getCurrentUserRole();
  if (!currentRole) return false;

  const currentLevel = ROLE_HIERARCHY[currentRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];

  // Can only create roles at your level or below
  return targetLevel <= currentLevel;
}

/**
 * Get all team member IDs that the current user can see based on hierarchy.
 * - Owner: sees everyone
 * - Head/Manager/TL/ATL: sees themselves + everyone who reports to them (direct & indirect)
 * - Recruiter: sees only themselves
 *
 * @returns Array of user IDs accessible to the current user
 */
export async function getAccessibleTeamMemberIds(): Promise<string[]> {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) {
      throw new Error('User company not found');
    }

    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      throw new Error('Not authenticated');
    }
    const currentUserId = authData.user.id;

    // Fetch current user's role
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        user_roles (
          role_id,
          roles (
            name
          )
        )
      `)
      .eq('id', currentUserId)
      .eq('company_id', companyId)
      .single();

    if (userError) throw userError;

    const currentUserRole = currentUserData?.user_roles?.[0]?.roles?.name as RoleName | undefined;
    if (!currentUserRole) {
      // If no role assigned, user can only see themselves
      return [currentUserId];
    }

    // Owner sees everyone
    if (currentUserRole === 'Owner') {
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', companyId);

      if (allUsersError) throw allUsersError;
      return (allUsers || []).map(u => u.id);
    }

    // Recruiter sees only themselves
    if (currentUserRole === 'Recruiter') {
      return [currentUserId];
    }

    // For Head/Manager/TL/ATL: fetch all users and build hierarchy tree
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, reports_to')
      .eq('company_id', companyId);

    if (allUsersError) throw allUsersError;

    // Build a map of manager -> direct reports
    const reportsMap = new Map<string, string[]>();
    (allUsers || []).forEach(user => {
      if (user.reports_to) {
        const reports = reportsMap.get(user.reports_to) || [];
        reports.push(user.id);
        reportsMap.set(user.reports_to, reports);
      }
    });

    // Recursively get all subordinates
    const getSubordinates = (managerId: string): string[] => {
      const directReports = reportsMap.get(managerId) || [];
      const allSubordinates = [...directReports];

      directReports.forEach(reportId => {
        allSubordinates.push(...getSubordinates(reportId));
      });

      return allSubordinates;
    };

    // Current user + all their subordinates
    const accessibleIds = [currentUserId, ...getSubordinates(currentUserId)];
    return accessibleIds;
  } catch (error) {
    console.error('Error getting accessible team members:', error);
    // On error, default to current user only
    const { data: authData } = await supabase.auth.getUser();
    return authData.user ? [authData.user.id] : [];
  }
}

/**
 * Get the current user's role name
 */
export async function getCurrentUserRole(): Promise<RoleName | null> {
  try {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) return null;

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        user_roles (
          roles (
            name
          )
        )
      `)
      .eq('id', authData.user.id)
      .eq('company_id', companyId)
      .single();

    if (error) throw error;

    return userData?.user_roles?.[0]?.roles?.name as RoleName | null;
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}

/**
 * Check if current user has access to view a specific user's data
 */
export async function canAccessUserData(targetUserId: string): Promise<boolean> {
  const accessibleIds = await getAccessibleTeamMemberIds();
  return accessibleIds.includes(targetUserId);
}
