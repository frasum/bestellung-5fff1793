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
    const { token, items } = await req.json();

    if (!token || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Token and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing simple order submission:', { token: token.substring(0, 8) + '...', itemCount: items.length });

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

    // Get an admin user from the organization to use as submitted_by
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

    // Create employee order submission
    const { data: submission, error: submissionError } = await supabase
      .from('employee_order_submissions')
      .insert({
        organization_id: tokenData.organization_id,
        location_id: tokenData.location_id,
        submitted_by: adminProfile.id,
        submission_type: 'simple',
        status: 'pending',
        source_data: {
          token_label: tokenData.label,
          supplier_id: tokenData.supplier_id,
          supplier_name: tokenData.supplier?.name,
        },
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const orderItems = items.map((item: OrderItem) => ({
      submission_id: submission.id,
      article_id: item.article_id,
      recognized_text: item.article_name,
      quantity: item.quantity,
      confidence: 1.0,
      admin_corrected: false,
    }));

    const { error: itemsError } = await supabase
      .from('employee_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback submission
      await supabase.from('employee_order_submissions').delete().eq('id', submission.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Simple order submitted successfully. Submission ID: ${submission.id}, Items: ${items.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submission.id,
        message: 'Order submitted for approval',
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
