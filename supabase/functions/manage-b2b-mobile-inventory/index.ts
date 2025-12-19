import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifiedSession {
  accountId: string;
  supplierId: string | null;
}

async function verifyToken(supabaseClient: any, token: string): Promise<VerifiedSession | null> {
  const { data: tokenData, error } = await supabaseClient
    .from('b2b_mobile_tokens')
    .select('account_id, supplier_id, is_active, expires_at')
    .eq('token', token)
    .single();

  if (error || !tokenData) {
    console.error('Token not found:', error);
    return null;
  }

  if (!tokenData.is_active) {
    console.error('Token is inactive');
    return null;
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    console.error('Token has expired');
    return null;
  }

  return {
    accountId: tokenData.account_id,
    supplierId: tokenData.supplier_id,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action, data } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    const session = await verifyToken(supabaseClient, token);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action: ${action}, AccountId: ${session.accountId}, SupplierId: ${session.supplierId}`);

    switch (action) {
      case 'load-data': {
        // Load vendors
        let vendorQuery = supabaseClient
          .from('b2b_supplier_vendors')
          .select('id, name')
          .eq('supplier_account_id', session.accountId)
          .eq('is_active', true)
          .order('name');

        if (session.supplierId) {
          vendorQuery = vendorQuery.eq('supplier_id', session.supplierId);
        }

        const { data: vendors, error: vendorError } = await vendorQuery;
        if (vendorError) {
          console.error('Error loading vendors:', vendorError);
          throw new Error('Failed to load vendors');
        }

        const vendorIds = (vendors || []).map((v: any) => v.id);

        // Load articles
        let articles: any[] = [];
        if (vendorIds.length > 0) {
          const { data: articleData, error: articleError } = await supabaseClient
            .from('b2b_supplier_vendor_articles')
            .select('id, name, price, unit, category, vendor_id')
            .eq('supplier_account_id', session.accountId)
            .eq('is_active', true)
            .in('vendor_id', vendorIds)
            .order('name');

          if (articleError) {
            console.error('Error loading articles:', articleError);
            throw new Error('Failed to load articles');
          }
          articles = articleData || [];
        }

        // Load sessions
        let sessionQuery = supabaseClient
          .from('b2b_inventory_sessions')
          .select('id, name, status, created_at')
          .eq('supplier_account_id', session.accountId)
          .order('created_at', { ascending: false });

        if (session.supplierId) {
          sessionQuery = sessionQuery.eq('supplier_id', session.supplierId);
        }

        const { data: sessions, error: sessionError } = await sessionQuery;
        if (sessionError) {
          console.error('Error loading sessions:', sessionError);
          throw new Error('Failed to load sessions');
        }

        return new Response(
          JSON.stringify({ vendors: vendors || [], articles, sessions: sessions || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create-session': {
        const { name } = data || {};
        if (!name) {
          return new Response(
            JSON.stringify({ error: 'Session name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newSession, error } = await supabaseClient
          .from('b2b_inventory_sessions')
          .insert({
            supplier_account_id: session.accountId,
            supplier_id: session.supplierId,
            name: name.trim(),
            status: 'in_progress',
            user_id: session.accountId, // Use accountId as user reference for mobile
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating session:', error);
          throw new Error('Failed to create session');
        }

        console.log('Session created:', newSession.id);

        return new Response(
          JSON.stringify({ session: newSession }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'load-session-items': {
        const { sessionId } = data || {};
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: items, error } = await supabaseClient
          .from('b2b_inventory_items')
          .select('article_id, storage_1, storage_2, unit_price')
          .eq('session_id', sessionId);

        if (error) {
          console.error('Error loading session items:', error);
          throw new Error('Failed to load session items');
        }

        return new Response(
          JSON.stringify({ items: items || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'save-inventory': {
        const { sessionId, items } = data || {};
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete existing items for this session
        const { error: deleteError } = await supabaseClient
          .from('b2b_inventory_items')
          .delete()
          .eq('session_id', sessionId);

        if (deleteError) {
          console.error('Error deleting items:', deleteError);
          throw new Error('Failed to delete existing items');
        }

        // Insert new items
        if (items && items.length > 0) {
          const itemsToInsert = items.map((item: any) => ({
            session_id: sessionId,
            article_id: item.article_id,
            storage_1: item.storage_1,
            storage_2: item.storage_2,
            unit_price: item.unit_price,
          }));

          const { error: insertError } = await supabaseClient
            .from('b2b_inventory_items')
            .insert(itemsToInsert);

          if (insertError) {
            console.error('Error inserting items:', insertError);
            throw new Error('Failed to save inventory items');
          }
        }

        console.log('Inventory saved:', items?.length || 0, 'items');

        return new Response(
          JSON.stringify({ success: true, itemCount: items?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete-session': {
        const { sessionId } = data || {};
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('b2b_inventory_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Error completing session:', error);
          throw new Error('Failed to complete session');
        }

        console.log('Session completed:', sessionId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
