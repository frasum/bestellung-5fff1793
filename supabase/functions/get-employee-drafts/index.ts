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
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get employee_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select('*, employee:employees(id, name)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.log('Invalid token:', tokenError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const employeeId = tokenData.employee_id;
    
    if (!employeeId) {
      // Token has no employee assigned - can only view drafts from current session
      return new Response(
        JSON.stringify({ drafts: [], message: 'No employee assigned to token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all drafts for this employee
    const { data: drafts, error: draftsError } = await supabase
      .from('cart_drafts')
      .select(`
        id,
        name,
        notes,
        location_id,
        desired_delivery_date,
        desired_time_window,
        created_at,
        updated_at,
        location:locations(id, name, short_code),
        items:cart_draft_items(
          id,
          quantity,
          article:articles(id, name, unit, price, supplier_id, supplier:suppliers(id, name))
        )
      `)
      .eq('organization_id', tokenData.organization_id)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (draftsError) {
      console.error('Error fetching drafts:', draftsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch completed orders for this employee
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        delivery_address,
        notes,
        created_at,
        location_id,
        location:locations(id, name, short_code),
        supplier:suppliers(id, name),
        items:order_items(
          id,
          article_name,
          quantity,
          unit,
          unit_price,
          total_price
        )
      `)
      .eq('organization_id', tokenData.organization_id)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      // Don't fail completely, just return empty orders
    }

    console.log(`Found ${drafts?.length || 0} drafts and ${orders?.length || 0} orders for employee ${employeeId}`);

    return new Response(
      JSON.stringify({ 
        drafts: drafts || [],
        orders: orders || [],
        employee_name: tokenData.employee?.name || tokenData.employee_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-employee-drafts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
