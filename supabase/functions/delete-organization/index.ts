import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeleteOrganizationRequest {
  code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create regular client to verify admin status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code }: DeleteOrganizationRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Organization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the organization details to find the associated user
    const { data: orgData, error: orgFetchError } = await supabaseAdmin
      .from('organization_codes')
      .select('email')
      .eq('code', code)
      .single();

    if (orgFetchError) {
      console.error('Error fetching organization data:', orgFetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch organization data: ${orgFetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orgData) {
      return new Response(
        JSON.stringify({ error: `Organization code "${code}" not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the associated user account by email using admin client
    const { data: userData, error: userFetchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userFetchError) {
      console.error('Error fetching users:', userFetchError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch users: ${userFetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizationUser = userData.users.find(user => user.email === orgData.email);

    // First, disassociate all profiles from this organization
    const { data: linkedProfiles, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ organization_code: null })
      .eq('organization_code', code)
      .select('id, email, role');

    if (updateError) {
      console.error('Error disassociating profiles:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to disassociate profiles: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const disassociatedCount = linkedProfiles?.length || 0;
    console.log(`Disassociated ${disassociatedCount} profiles from organization ${code}`);

    // Verify that no profiles are still linked to this organization code
    const { data: remainingProfiles, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('organization_code', code);

    if (checkError) {
      console.error('Error checking for linked profiles:', checkError);
      return new Response(
        JSON.stringify({ error: `Failed to verify profile disassociation: ${checkError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (remainingProfiles && remainingProfiles.length > 0) {
      const profileDetails = remainingProfiles.map(p => `${p.email} (${p.role})`).join(', ');
      return new Response(
        JSON.stringify({ 
          error: `Cannot delete organization code "${code}": ${remainingProfiles.length} profile(s) are still associated with this organization. Affected profiles: ${profileDetails}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the organization user account if it exists
    if (organizationUser) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(organizationUser.id);
      
      if (deleteUserError) {
        console.error('Error deleting organization user:', deleteUserError);
        console.warn(`Failed to delete user account for ${orgData.email}, but continuing with organization code deletion`);
      } else {
        console.log(`Successfully deleted user account for ${orgData.email}`);
      }
    }

    // Now delete the organization code
    const { error: deleteError } = await supabaseAdmin
      .from('organization_codes')
      .delete()
      .eq('code', code);

    if (deleteError) {
      console.error('Error deleting organization code:', deleteError);
      
      if (deleteError.code === '23503') {
        return new Response(
          JSON.stringify({ 
            error: `Cannot delete organization code "${code}": There are still user profiles linked to this organization.` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted organization code: ${code}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Organization code "${code}" deleted successfully`,
        disassociatedProfiles: disassociatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-organization function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});