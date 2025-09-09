import { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentUserCompanyId } from '../lib/supabase';
import { useToast } from './useToast';

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
  department: string;
  permissions?: string[];
  reportsTo?: string;
}

export interface UpdateTeamMemberInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  department?: string;
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

        // Build direct reports count map from raw rows
        const reportsCount = new Map<string, number>();
        (userRows || []).forEach((user: any) => {
          if (user.reports_to) {
            reportsCount.set(user.reports_to, (reportsCount.get(user.reports_to) || 0) + 1);
          }
        });

        // Transform user data
        const members: TeamMember[] = (userRows || []).map((user: any) => {
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

        // Seed default roles if none exist
        if (!roleRows || roleRows.length === 0) {
          const defaultRoles = [
            { name: 'Owner', description: 'Full access to all data and settings.' },
            { name: 'Head', description: 'Full access similar to Owner.' },
            { name: 'Manager', description: 'Manages TLs/ATLs and their teams.' },
            { name: 'TL', description: 'Team Lead managing ATLs/Recruiters.' },
            { name: 'ATL', description: 'Assistant Team Lead managing Recruiters.' },
            { name: 'Recruiter', description: 'Manages candidates and applications.' },
          ];

          const { error: seedError } = await supabase
            .from('roles')
            .insert(
              defaultRoles.map(r => ({
                company_id: companyId,
                name: r.name,
                description: r.description,
                permissions: [],
                is_active: true,
              }))
            );

          if (seedError) throw seedError;

          const refetchRoles = await supabase
            .from('roles')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

          roleRows = refetchRoles.data || [];
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

      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error('Not authenticated');

      // First, create the invitation record
      const { data: invitationData, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          phone: input.phone,
          company_id: companyId,
          role_id: input.roleId,
          reports_to: input.reportsTo || null,
          status: 'pending',
          invited_by: currentUser.data.user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Get company details for the signup metadata
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name, slug, size, subscription_plan')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Now create the auth user - the trigger will handle the rest
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: crypto.randomUUID(), // Temporary password, user will reset via email
        options: {
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            company: {
              name: companyData.name,
              slug: companyData.slug,
              size: companyData.size,
              subscriptionPlan: companyData.subscription_plan
            },
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        // If auth signup fails, clean up the invitation
        await supabase
          .from('team_invitations')
          .delete()
          .eq('id', invitationData.id);
        throw error;
      }

      // Update invitation with auth user ID and assign role to the invited user
      if (data.user?.id) {
        // Link auth user to invitation
        await supabase
          .from('team_invitations')
          .update({ auth_user_id: data.user.id })
          .eq('id', invitationData.id);

        // Assign role immediately so the user shows up with a proper role
        // Remove any existing roles just in case, then insert the selected role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', data.user.id);

        const { error: roleAssignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role_id: input.roleId,
          });

        if (roleAssignError) {
          console.warn('Failed to assign role to invited user:', roleAssignError);
          // Do not throw here to avoid blocking the invitation email
        }
      }

      showSuccess(`Invitation sent to ${input.email}. They will receive a confirmation email to set up their account.`);
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      showError(err.message || 'Failed to invite team member');
      return { error: err.message };
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
