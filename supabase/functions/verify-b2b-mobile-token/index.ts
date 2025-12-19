import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying B2B mobile token');

    // Find the token with account info
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('b2b_mobile_tokens')
      .select(`
        *,
        account:supplier_b2b_accounts(
          id,
          company_name,
          email
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is active
    if (!tokenData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Token is inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the single supplier for this account (1 Account = 1 Supplier)
    const { data: supplier } = await supabaseClient
      .from('b2b_suppliers')
      .select('id, name')
      .eq('account_id', tokenData.account_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    // Update used_at timestamp if this is first use
    if (!tokenData.used_at) {
      await supabaseClient
        .from('b2b_mobile_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id);
    }

    console.log('Token verified successfully for account:', tokenData.account_id);

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          accountId: tokenData.account_id,
          supplierId: supplier?.id || null,
          // Use company_name as the display name (1 Account = 1 Supplier)
          companyName: tokenData.account?.company_name,
          supplierName: supplier?.name || tokenData.account?.company_name,
          expiresAt: tokenData.expires_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
