import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  article_id: string;
  article_name: string;
  quantity: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, items, employee_name, location_id, supplier_id: requestSupplierId, delivery_date, time_window } = await req.json();

    if (!token || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Token and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!employee_name || !location_id) {
      return new Response(
        JSON.stringify({ error: 'Employee name and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing simple order submission:', { token: token.substring(0, 8) + '...', itemCount: items.length, employee_name, location_id, delivery_date, time_window });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select(`
        *,
        supplier:suppliers(id, name, organization_id)
      `)
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

    // Get an admin user from the organization to use as user_id for the draft
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', tokenData.organization_id)
      .limit(1)
      .single();

    if (adminError || !adminProfile) {
      console.error('No admin found for organization');
      return new Response(
        JSON.stringify({ error: 'Organization configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supplierId = requestSupplierId || tokenData.supplier_id;

    // Fetch supplier name - for multi-supplier tokens, we need to query the DB
    let supplierName = tokenData.supplier?.name;
    if (!supplierName && supplierId) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();
      supplierName = supplierData?.name;
    }
    supplierName = supplierName || 'Unbekannt';

    // Create cart draft with EasyOrder naming convention
    const draftName = `EasyOrder: ${employee_name}`;
    const notes = `Lieferant: ${supplierName}`;

    const { data: draft, error: draftError } = await supabase
      .from('cart_drafts')
      .insert({
        organization_id: tokenData.organization_id,
        user_id: adminProfile.id,
        location_id: location_id,
        name: draftName,
        notes: notes,
        desired_delivery_date: delivery_date || null,
        desired_time_window: time_window || null,
      })
      .select()
      .single();

    if (draftError) {
      console.error('Error creating cart draft:', draftError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order draft' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create cart draft items
    const draftItems = items.map((item: OrderItem) => ({
      draft_id: draft.id,
      article_id: item.article_id,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('cart_draft_items')
      .insert(draftItems);

    if (itemsError) {
      console.error('Error creating draft items:', itemsError);
      // Rollback draft
      await supabase.from('cart_drafts').delete().eq('id', draft.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`EasyOrder submitted successfully as cart draft. Draft ID: ${draft.id}, Items: ${items.length}`);

    // Get location name for notification
    let locationName = 'Unbekannt';
    if (location_id) {
      const { data: locationData } = await supabase
        .from('locations')
        .select('name, short_code')
        .eq('id', location_id)
        .single();
      if (locationData) {
        locationName = locationData.short_code || locationData.name;
      }
    }

    // Send notification to admins/managers (fire and forget, don't block response)
    supabase.functions.invoke('notify-preorder-received', {
      body: {
        organization_id: tokenData.organization_id,
        employee_name,
        supplier_name: supplierName,
        location_name: locationName,
        items: items.map((item: OrderItem) => ({
          article_name: item.article_name,
          quantity: item.quantity,
        })),
      },
    }).catch(err => console.error('Failed to send preorder notification:', err));

    return new Response(
      JSON.stringify({
        success: true,
        draft_id: draft.id,
        message: 'Order saved as pre-order',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-simple-order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
