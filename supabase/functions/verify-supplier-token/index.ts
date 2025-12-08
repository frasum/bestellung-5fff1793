import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token provided', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying token...');

    // Fetch the token with supplier data using service role (bypasses RLS)
    const { data: tokenData, error: tokenError } = await supabase
      .from('supplier_portal_tokens')
      .select('*, suppliers(*)')
      .eq('token', token)
      .maybeSingle();

    if (tokenError) {
      console.error('Token query error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token verification failed', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      console.log('Token not found');
      return new Response(
        JSON.stringify({ error: 'Invalid token', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log('Token expired');
      return new Response(
        JSON.stringify({ 
          error: 'Token expired', 
          status: 'expired',
          supplierId: tokenData.supplier_id,
          supplierEmail: tokenData.suppliers?.email
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track first usage but allow multiple logins within validity period
    if (!tokenData.used_at) {
      await supabase
        .from('supplier_portal_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id);
      console.log('Token first used at:', new Date().toISOString());
    } else {
      console.log('Token reused (first used at:', tokenData.used_at, ')');
    }

    console.log('Token verified successfully for supplier:', tokenData.suppliers?.name);

    // Return supplier session data including expiry
    return new Response(
      JSON.stringify({
        status: 'success',
        supplierId: tokenData.supplier_id,
        supplierName: tokenData.suppliers?.name || 'Lieferant',
        organizationId: tokenData.suppliers?.organization_id,
        expiresAt: tokenData.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-supplier-token:', error);
    return new Response(
      JSON.stringify({ error: error.message, status: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
