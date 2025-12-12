import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  article_id: string;
  quantity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, draft_id, items, delivery_date, time_window } = await req.json();

    if (!token || !draft_id) {
      return new Response(
        JSON.stringify({ error: 'Token and draft_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
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
      return new Response(
        JSON.stringify({ error: 'No employee assigned to token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify draft belongs to this employee
    const { data: draft, error: draftError } = await supabase
      .from('cart_drafts')
      .select('id, employee_id, organization_id')
      .eq('id', draft_id)
      .eq('organization_id', tokenData.organization_id)
      .single();

    if (draftError || !draft) {
      return new Response(
        JSON.stringify({ error: 'Draft not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (draft.employee_id !== employeeId) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to edit this draft' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update draft metadata
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (delivery_date !== undefined) {
      updateData.desired_delivery_date = delivery_date;
    }
    if (time_window !== undefined) {
      updateData.desired_time_window = time_window;
    }

    const { error: updateError } = await supabase
      .from('cart_drafts')
      .update(updateData)
      .eq('id', draft_id);

    if (updateError) {
      console.error('Error updating draft:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update draft' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('cart_draft_items')
      .delete()
      .eq('draft_id', draft_id);

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to update items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new items
    const draftItems = items.map((item: OrderItem) => ({
      draft_id: draft_id,
      article_id: item.article_id,
      quantity: item.quantity,
    }));

    const { error: insertError } = await supabase
      .from('cart_draft_items')
      .insert(draftItems);

    if (insertError) {
      console.error('Error inserting items:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Draft ${draft_id} updated with ${items.length} items`);

    return new Response(
      JSON.stringify({ success: true, draft_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-employee-draft:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
