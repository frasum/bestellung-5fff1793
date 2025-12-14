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
    const { token, name, description, category, unit, supplier_id, image_url, original_article_id } = await req.json();

    if (!token || !name || !supplier_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select('id, organization_id, employee:employees(id, name, can_capture_photos, can_add_free_items)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if employee has permission (can_capture_photos OR can_add_free_items)
    const employee = tokenData.employee as any;
    const canCapture = employee?.can_capture_photos;
    const canAddFreeItems = employee?.can_add_free_items;
    if (!canCapture && !canAddFreeItems) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to capture photos or add free items' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify supplier belongs to organization
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplier_id)
      .eq('organization_id', tokenData.organization_id)
      .single();

    if (supplierError || !supplier) {
      return new Response(
        JSON.stringify({ error: 'Supplier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create suggested article with image
    const { data: suggestion, error: insertError } = await supabase
      .from('suggested_articles')
      .insert({
        organization_id: tokenData.organization_id,
        supplier_id,
        name,
        category: category || null,
        unit: unit || 'Stk',
        price: 0, // Default price, admin will set
        source: 'employee_photo',
        employee_id: employee.id,
        image_url: image_url || null,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating suggestion:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create suggestion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Photo suggestion created by employee ${employee.name}: ${name}`);

    return new Response(
      JSON.stringify({ success: true, suggestion_id: suggestion.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-photo-suggestion:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
