// Supabase Edge Function for inviting team members
// Deploy with: supabase functions deploy invite-user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  reportsTo?: string;
  companyId: string;
  redirectTo?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: InviteUserPayload = await req.json();
    
    console.log('Received invitation request:', { 
      email: payload.email, 
      companyId: payload.companyId,
      roleId: payload.roleId 
    });

    // Validate required fields
    if (!payload.email || !payload.firstName || !payload.lastName || !payload.roleId || !payload.companyId) {
      console.error('Missing required fields:', payload);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, firstName, lastName, roleId, and companyId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has permission to invite team members
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('company_id, user_roles(roles(permissions))')
      .eq('id', user.id)
      .single();

    if (!currentUser || currentUser.company_id !== payload.companyId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only invite users to your own company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get company details for email context
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('name, slug, size, subscription_plan')
      .eq('id', payload.companyId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing pending invitation and delete it (to allow resending)
    console.log('Checking for existing invitations...');
    const { data: existingInvitations } = await supabaseAdmin
      .from('team_invitations')
      .select('id, auth_user_id')
      .eq('email', payload.email)
      .eq('company_id', payload.companyId)
      .eq('status', 'pending');

    if (existingInvitations && existingInvitations.length > 0) {
      console.log('Found existing pending invitation, deleting...');
      // Delete old auth users if they exist
      for (const inv of existingInvitations) {
        if (inv.auth_user_id) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(inv.auth_user_id);
          } catch (e) {
            console.log('Could not delete auth user:', e);
          }
        }
      }
      // Delete old invitations
      await supabaseAdmin
        .from('team_invitations')
        .delete()
        .eq('email', payload.email)
        .eq('company_id', payload.companyId)
        .eq('status', 'pending');
    }

    // Verify that role_id exists in the roles table for this company
    console.log('Verifying role exists...');
    const { data: roleCheck, error: roleCheckError } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', payload.roleId)
      .eq('company_id', payload.companyId)
      .single();

    if (roleCheckError || !roleCheck) {
      console.error('Role not found:', { roleId: payload.roleId, companyId: payload.companyId, error: roleCheckError });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid role',
          details: `The specified role does not exist for this company. Role ID: ${payload.roleId}`,
          code: 'ROLE_NOT_FOUND'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reports_to user exists if provided
    if (payload.reportsTo) {
      const { data: managerCheck, error: managerCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', payload.reportsTo)
        .eq('company_id', payload.companyId)
        .single();

      if (managerCheckError || !managerCheck) {
        console.error('Manager not found:', { reportsTo: payload.reportsTo, error: managerCheckError });
        return new Response(
          JSON.stringify({ 
            error: 'Invalid manager',
            details: `The specified manager does not exist in this company.`,
            code: 'MANAGER_NOT_FOUND'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create invitation record
    console.log('Creating new invitation record...', {
      email: payload.email,
      roleId: payload.roleId,
      roleName: roleCheck.name,
      companyId: payload.companyId,
      reportsTo: payload.reportsTo || null
    });
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
        company_id: payload.companyId,
        role_id: payload.roleId,
        reports_to: payload.reportsTo || null,
        status: 'pending',
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create invitation',
          details: inviteError.message,
          code: inviteError.code,
          hint: inviteError.hint || 'Check that all required fields are valid and foreign keys exist.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Invitation record created:', invitation.id);

    // Use Supabase Admin API to invite user by email
    // This sends a proper invitation email with a magic link
    console.log('Sending invitation email via Supabase Auth...');
    const redirectUrl = payload.redirectTo || `${req.headers.get('origin') || 'http://localhost:5173'}/accept-invitation`;
    console.log('Redirect URL:', redirectUrl);
    
    let invitedUser, inviteUserError;
    try {
      const result = await supabaseAdmin.auth.admin.inviteUserByEmail(
        payload.email,
        {
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            company: {
              id: payload.companyId,
              name: company.name,
              slug: company.slug,
              size: company.size,
              subscriptionPlan: company.subscription_plan,
            },
            invitationId: invitation.id,
          },
          redirectTo: redirectUrl,
        }
      );
      invitedUser = result.data;
      inviteUserError = result.error;
    } catch (e) {
      console.error('Exception calling inviteUserByEmail:', e);
      await supabaseAdmin
        .from('team_invitations')
        .delete()
        .eq('id', invitation.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: e.message || 'Unknown error',
          code: 'INVITE_EXCEPTION',
          version: '5.1'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (inviteUserError) {
      // Clean up invitation if invite fails
      console.error('Error inviting user via Supabase Auth:', inviteUserError);
      await supabaseAdmin
        .from('team_invitations')
        .delete()
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: inviteUserError.message,
          code: inviteUserError.status || inviteUserError.code,
          version: '5.1'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Invitation email sent successfully to:', payload.email);

    // Update invitation with auth user ID
    if (invitedUser?.user?.id) {
      console.log('Updating invitation with auth_user_id:', invitedUser.user.id);
      const { error: updateInvError } = await supabaseAdmin
        .from('team_invitations')
        .update({ auth_user_id: invitedUser.user.id })
        .eq('id', invitation.id);

      if (updateInvError) {
        console.error('Error updating invitation:', updateInvError);
      }

      // Create user record in users table
      console.log('Creating user record in public.users table...');
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: invitedUser.user.id,
          company_id: payload.companyId,
          email: payload.email,
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone || null,
          is_active: false, // Will be activated when they accept the invitation
        });

      if (userInsertError) {
        console.error('Error creating user record:', userInsertError);
        // Clean up: delete the auth user since we couldn't create the app user
        await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
        await supabaseAdmin
          .from('team_invitations')
          .delete()
          .eq('id', invitation.id);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user record',
            details: userInsertError.message,
            code: userInsertError.code,
            hint: userInsertError.hint || 'Database constraint error',
            version: '5.1'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign role to the invited user
      console.log('Assigning role to user...');
      const { error: roleAssignError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: invitedUser.user.id,
          role_id: payload.roleId,
        });

      if (roleAssignError) {
        console.error('Error assigning role:', roleAssignError);
        // Clean up: delete user and auth user
        await supabaseAdmin.from('users').delete().eq('id', invitedUser.user.id);
        await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
        await supabaseAdmin
          .from('team_invitations')
          .delete()
          .eq('id', invitation.id);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to assign role',
            details: roleAssignError.message,
            code: roleAssignError.code,
            hint: roleAssignError.hint || 'Database constraint error',
            version: '5.1'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully with role assigned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${payload.email}`,
        data: {
          invitationId: invitation.id,
          userId: invitedUser?.user?.id,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
