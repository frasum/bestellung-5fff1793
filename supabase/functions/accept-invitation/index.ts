import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to get current user
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invitation for user:', user.email);

    // Find the invitation by token
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.error('Invitation expired:', invitation.expires_at);
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user email matches invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      console.error('Email mismatch:', user.email, invitation.email);
      return new Response(
        JSON.stringify({ error: 'This invitation was sent to a different email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation valid, updating user profile to org:', invitation.organization_id);

    // Update user's profile to join the organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ organization_id: invitation.organization_id })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a role, if so update it, otherwise insert
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingRole) {
      // Update existing role
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: invitation.role })
        .eq('user_id', user.id);

      if (roleUpdateError) {
        console.error('Role update error:', roleUpdateError);
      }
    } else {
      // Insert new role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: user.id, role: invitation.role });

      if (roleInsertError) {
        console.error('Role insert error:', roleInsertError);
      }
    }

    console.log('User role set to:', invitation.role);

    // Delete the invitation (one-time use)
    const { error: deleteError } = await supabaseAdmin
      .from('team_invitations')
      .delete()
      .eq('id', invitation.id);

    if (deleteError) {
      console.error('Invitation delete error:', deleteError);
      // Don't fail the whole operation for this
    }

    // Get organization name for the response
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single();

    console.log('Invitation accepted successfully for org:', org?.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        organizationName: org?.name || 'Organization',
        role: invitation.role
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
