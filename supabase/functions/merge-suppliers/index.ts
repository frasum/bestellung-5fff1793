import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const organizationId = profile.organization_id;
    const { sourceId, targetId, deleteSource = true } = await req.json();

    if (!sourceId || !targetId) {
      return new Response(JSON.stringify({ error: 'sourceId and targetId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sourceId === targetId) {
      return new Response(JSON.stringify({ error: 'Source and target cannot be the same' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Merging supplier ${sourceId} into ${targetId}`);

    // Verify both suppliers belong to this organization
    const { data: suppliers, error: supplierError } = await supabaseClient
      .from('suppliers')
      .select('id, name, email, phone, address, customer_number')
      .eq('organization_id', organizationId)
      .in('id', [sourceId, targetId]);

    if (supplierError || !suppliers || suppliers.length !== 2) {
      return new Response(JSON.stringify({ error: 'Suppliers not found in organization' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceSupplier = suppliers.find(s => s.id === sourceId)!;
    const targetSupplier = suppliers.find(s => s.id === targetId)!;

    console.log(`Source: ${sourceSupplier.name}, Target: ${targetSupplier.name}`);

    // Move articles from source to target
    const { data: movedArticles, error: articleError } = await supabaseClient
      .from('articles')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId)
      .eq('organization_id', organizationId)
      .select('id, name');

    if (articleError) {
      console.error('Error moving articles:', articleError);
      return new Response(JSON.stringify({ error: 'Failed to move articles: ' + articleError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Moved ${movedArticles?.length || 0} articles`);

    // Update orders to point to target supplier
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId);

    if (orderError) {
      console.error('Error updating orders:', orderError);
    }

    // Update invoices to point to target supplier
    const { error: invoiceError } = await supabaseClient
      .from('invoices')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId);

    if (invoiceError) {
      console.error('Error updating invoices:', invoiceError);
    }

    // Update cart_draft_items to point to target supplier
    const { error: cartError } = await supabaseClient
      .from('cart_draft_items')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId);

    if (cartError) {
      console.error('Error updating cart_draft_items:', cartError);
    }

    // Update communication_logs to point to target supplier
    const { error: commError } = await supabaseClient
      .from('communication_logs')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId);

    if (commError) {
      console.error('Error updating communication_logs:', commError);
    }

    // Update supplier_locations to point to target supplier
    const { error: locError } = await supabaseClient
      .from('supplier_locations')
      .update({ supplier_id: targetId })
      .eq('supplier_id', sourceId);

    if (locError) {
      console.error('Error updating supplier_locations:', locError);
    }

    // Update target supplier with missing data from source
    const updates: Record<string, string> = {};
    
    if (sourceSupplier.phone && !targetSupplier.phone) {
      updates.phone = sourceSupplier.phone;
    }
    if (sourceSupplier.email && (!targetSupplier.email || targetSupplier.email.includes('.auto'))) {
      updates.email = sourceSupplier.email;
    }
    if (sourceSupplier.address && !targetSupplier.address) {
      updates.address = sourceSupplier.address;
    }
    if (sourceSupplier.customer_number && !targetSupplier.customer_number) {
      updates.customer_number = sourceSupplier.customer_number;
    }

    if (Object.keys(updates).length > 0) {
      console.log('Updating target supplier with:', updates);
      await supabaseClient
        .from('suppliers')
        .update(updates)
        .eq('id', targetId);
    }

    // Delete or deactivate source supplier
    if (deleteSource) {
      console.log('Deleting source supplier');
      const { error: deleteError } = await supabaseClient
        .from('suppliers')
        .delete()
        .eq('id', sourceId);

      if (deleteError) {
        console.error('Error deleting source supplier:', deleteError);
        // Fallback: deactivate instead
        await supabaseClient
          .from('suppliers')
          .update({ is_active: false })
          .eq('id', sourceId);
      }
    } else {
      // Just deactivate
      await supabaseClient
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', sourceId);
    }

    return new Response(JSON.stringify({
      success: true,
      articlesMoved: movedArticles?.length || 0,
      sourceSupplier: sourceSupplier.name,
      targetSupplier: targetSupplier.name,
      updatedFields: Object.keys(updates),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Merge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
