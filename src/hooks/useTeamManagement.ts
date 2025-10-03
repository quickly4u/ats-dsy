import { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentUserCompanyId } from '../lib/supabase';
import { useToast } from './useToast';
import { getAccessibleTeamMemberIds } from '../utils/hierarchy';

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  reportsTo?: string;
  directReports: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface CreateTeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  permissions?: string[];
  reportsTo?: string;
}

export interface UpdateTeamMemberInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  status?: 'active' | 'inactive' | 'pending';
  permissions?: string[];
  reportsTo?: string;
}

export const useTeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const refetch = useCallback(() => setReloadToken(t => t + 1), []);

  // Fetch team members with roles and permissions
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }

        // Get accessible team member IDs based on hierarchy
        const accessibleUserIds = await getAccessibleTeamMemberIds();

        // Fetch users with their roles
        const { data: userRows, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            first_name,
            last_name,
            phone,
            avatar,
            is_active,
            created_at,
            reports_to,
            user_roles (
              role_id,
              roles (
                id,
                name,
                description,
                permissions,
                is_active
              )
            )
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (userError) throw userError;

        // Filter by hierarchy: only show team members accessible to current user
        const filteredUserRows = (userRows || []).filter((user: any) =>
          accessibleUserIds.includes(user.id)
        );

        // Build direct reports count map from filtered rows
        const reportsCount = new Map<string, number>();
        filteredUserRows.forEach((user: any) => {
          if (user.reports_to) {
            reportsCount.set(user.reports_to, (reportsCount.get(user.reports_to) || 0) + 1);
          }
        });

        // Transform user data
        const members: TeamMember[] = filteredUserRows.map((user: any) => {
          const userRole = user.user_roles?.[0]?.roles;
          const permissions = userRole?.permissions || [];
          
          return {
            id: user.id,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            phone: user.phone,
            avatar: user.avatar,
            role: userRole?.name || 'Team Member',
            department: 'General', // TODO: Add department management
            status: user.is_active ? 'active' : 'inactive',
            permissions: Array.isArray(permissions) ? permissions : [],
            reportsTo: user.reports_to || undefined,
            directReports: reportsCount.get(user.id) || 0,
            lastLogin: undefined, // TODO: Track last login
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at || user.created_at),
          };
        });

        setTeamMembers(members);

        // Fetch available roles
        let { data: roleRows, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name');

        if (roleError) throw roleError;

        // Check if we need to add missing roles (ATL, TL, Head)
        const existingRoleNames = (roleRows || []).map((r: any) => r.name);
        const requiredRoles = [
          { name: 'Owner', description: 'Full access to all data and settings.' },
          { name: 'Head', description: 'Full access similar to Owner.' },
          { name: 'Manager', description: 'Manages TLs/ATLs and their teams.' },
          { name: 'TL', description: 'Team Lead managing ATLs/Recruiters.' },
          { name: 'ATL', description: 'Assistant Team Lead managing Recruiters.' },
          { name: 'Recruiter', description: 'Manages candidates and applications.' },
        ];

        const missingRoles = requiredRoles.filter(r => !existingRoleNames.includes(r.name));
        
        if (missingRoles.length > 0) {
          console.log('Adding missing roles:', missingRoles.map(r => r.name));
          const { error: seedError } = await supabase
            .from('roles')
            .insert(
              missingRoles.map(r => ({
                company_id: companyId,
                name: r.name,
                description: r.description,
                permissions: [],
                is_active: true,
              }))
            );

          if (seedError) {
            console.error('Error seeding roles:', seedError);
            // Don't throw - just log the error and continue with existing roles
          } else {
            // Refetch all roles after adding missing ones
            const refetchRoles = await supabase
              .from('roles')
              .select('*')
              .eq('company_id', companyId)
              .eq('is_active', true)
              .order('name');

            roleRows = refetchRoles.data || roleRows;
          }
        }

        const rolesData: Role[] = (roleRows || []).map((role: any) => ({
          id: role.id,
          name: role.name,
          description: role.description || '',
          permissions: Array.isArray(role.permissions) ? role.permissions : [],
          isActive: role.is_active,
          createdAt: new Date(role.created_at),
        }));

        setRoles(rolesData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching team data:', err);
        setError(err.message || 'Failed to fetch team data');
        setTeamMembers([]);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [reloadToken]);

  const inviteTeamMember = useCallback(async (input: CreateTeamMemberInput) => {
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) throw new Error('User company not found');

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const payload = {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        roleId: input.roleId,
        reportsTo: input.reportsTo,
        companyId: companyId,
        redirectTo: `${window.location.origin}/accept-invitation`,
      };

      console.log('Sending invitation with payload:', payload);

      // Make a direct fetch request to get the full error details
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`;
      const rawResponse = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await rawResponse.text();
      console.log('Raw Response Status:', rawResponse.status);
      console.log('Raw Response Body:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!rawResponse.ok) {
        const errorMsg = responseData?.error || 'Failed to send invitation';
        const details = responseData?.details || '';
        const code = responseData?.code || '';
        const hint = responseData?.hint || '';
        
        console.error('Error from Edge Function:', { errorMsg, details, code, hint });
        
        let fullError = errorMsg;
        if (details) fullError += `: ${details}`;
        if (hint) fullError += ` (${hint})`;
        
        throw new Error(fullError);
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Failed to send invitation');
      }

      showSuccess(`Invitation sent to ${input.email}. They will receive an email to set up their account.`);
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      const errorMessage = err.message || 'Failed to invite team member';
      showError(errorMessage);
      return { error: errorMessage };
    }
  }, [showSuccess, showError, refetch]);

  const updateTeamMember = useCallback(async (id: string, input: UpdateTeamMemberInput) => {
    try {
      const updates: any = {};
      if (input.firstName !== undefined) updates.first_name = input.firstName;
      if (input.lastName !== undefined) updates.last_name = input.lastName;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.reportsTo !== undefined) updates.reports_to = input.reportsTo || null;
      if (input.status !== undefined) updates.is_active = input.status === 'active';

      if (Object.keys(updates).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id);

        if (userError) throw userError;
      }

      // Update role if provided
      if (input.roleId) {
        // Remove existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', id);

        // Add new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: id,
            role_id: input.roleId,
          });

        if (roleError) throw roleError;
      }

      showSuccess('Team member updated successfully');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating team member:', err);
      showError(err.message || 'Failed to update team member');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  const deactivateTeamMember = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      showSuccess('Team member deactivated');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error deactivating team member:', err);
      showError(err.message || 'Failed to deactivate team member');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  const reactivateTeamMember = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      showSuccess('Team member reactivated');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error reactivating team member:', err);
      showError(err.message || 'Failed to reactivate team member');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  const deleteTeamMember = useCallback(async (id: string) => {
    try {
      // Remove role assignments first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);

      // Delete user record
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Team member removed');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting team member:', err);
      showError(err.message || 'Failed to remove team member');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  // Statistics
  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    pending: teamMembers.filter(m => m.status === 'pending').length,
    inactive: teamMembers.filter(m => m.status === 'inactive').length,
    totalPermissions: [...new Set(teamMembers.flatMap(m => m.permissions))].length,
  };

  return {
    teamMembers,
    roles,
    stats,
    isLoading,
    error,
    refetch,
    inviteTeamMember,
    updateTeamMember,
    deactivateTeamMember,
    reactivateTeamMember,
    deleteTeamMember,
  };
};
