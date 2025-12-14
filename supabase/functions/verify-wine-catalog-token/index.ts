import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { token, pin } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Verifying wine catalog token:', token.substring(0, 8) + '...');

    // Fetch token with employee info
    const { data: tokenData, error: tokenError } = await supabase
      .from('wine_catalog_tokens')
      .select(`
        *,
        employee:employees(id, name),
        organization:organizations(id, name)
      `)
      .eq('token', token)
      .maybeSingle();

    if (tokenError) {
      console.error('Token fetch error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      console.log('Token not found');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is active
    if (!tokenData.is_active) {
      console.log('Token is inactive');
      return new Response(
        JSON.stringify({ error: 'Token is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log('Token has expired');
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check PIN if required
    if (tokenData.pin_code) {
      // Rate limiting for PIN attempts
      await supabase.rpc('cleanup_wine_token_rate_limits');

      const { count: attemptCount } = await supabase
        .from('wine_token_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('token', token);

      if (attemptCount && attemptCount >= 5) {
        console.log('Too many PIN attempts');
        return new Response(
          JSON.stringify({ error: 'Too many attempts. Please try again later.', rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!pin) {
        return new Response(
          JSON.stringify({ requiresPin: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify PIN (simple comparison - PIN is stored as plain text for now)
      if (pin !== tokenData.pin_code) {
        // Record failed attempt
        await supabase.from('wine_token_rate_limits').insert({ token });

        console.log('Invalid PIN');
        return new Response(
          JSON.stringify({ error: 'Invalid PIN', invalidPin: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch wines for the organization
    const { data: wines, error: winesError } = await supabase
      .from('articles')
      .select(`
        id,
        name,
        description,
        category,
        selling_price,
        origin_country,
        grape_variety,
        flavor_profile,
        food_pairings,
        image_url,
        is_active,
        supplier:suppliers(id, name)
      `)
      .eq('organization_id', tokenData.organization_id)
      .eq('is_active', true)
      .ilike('category', '%wein%')
      .order('name');

    if (winesError) {
      console.error('Wines fetch error:', winesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch wines' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${wines?.length || 0} wines for organization ${tokenData.organization_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        token: {
          id: tokenData.id,
          label: tokenData.label,
          permission: tokenData.permission,
          employee: tokenData.employee,
          organization: tokenData.organization,
        },
        wines: wines || [],
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
