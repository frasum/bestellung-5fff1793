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
    const { token, article_id, action } = await req.json();

    if (!token || !article_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Token, article_id and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Action must be "add" or "remove"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Managing favorite: token=${token.substring(0, 8)}..., article_id=${article_id}, action=${action}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get employee_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select(`
        id,
        employee_id,
        employee:employees(id, name)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.log('Token not found or inactive:', tokenError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get employee_id from the token
    const employeeId = tokenData.employee_id || (tokenData.employee as any)?.id;

    if (!employeeId) {
      console.log('Token has no employee assigned - cannot save favorites');
      return new Response(
        JSON.stringify({ error: 'Token has no employee assigned. Favorites require a personalized token.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add') {
      // Add favorite (upsert to handle duplicates gracefully)
      const { error: insertError } = await supabase
        .from('employee_article_favorites')
        .upsert(
          { employee_id: employeeId, article_id },
          { onConflict: 'employee_id,article_id' }
        );

      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add favorite' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Added favorite: employee=${employeeId}, article=${article_id}`);
    } else {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('employee_article_favorites')
        .delete()
        .eq('employee_id', employeeId)
        .eq('article_id', article_id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove favorite' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Removed favorite: employee=${employeeId}, article=${article_id}`);
    }

    // Return updated favorites list
    const { data: favorites, error: favError } = await supabase
      .from('employee_article_favorites')
      .select('article_id')
      .eq('employee_id', employeeId);

    if (favError) {
      console.error('Error fetching favorites:', favError);
    }

    const favoriteIds = favorites?.map(f => f.article_id) || [];

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        favorite_article_ids: favoriteIds 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-simple-order-favorites:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
