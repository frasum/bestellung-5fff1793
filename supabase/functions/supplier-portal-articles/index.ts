import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleUpdateRequest {
  action: 'list' | 'update';
  supplierId: string;
  organizationId: string;
  articleId?: string;
  changes?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ArticleUpdateRequest = await req.json();
    const { action, supplierId, organizationId, articleId, changes } = body;

    console.log(`Supplier portal request: action=${action}, supplierId=${supplierId}`);

    if (!supplierId || !organizationId) {
      throw new Error('Missing supplierId or organizationId');
    }

    // Verify supplier exists and belongs to the organization
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, organization_id')
      .eq('id', supplierId)
      .eq('organization_id', organizationId)
      .single();

    if (supplierError || !supplier) {
      console.error('Supplier verification failed:', supplierError);
      throw new Error('Invalid supplier or organization');
    }

    if (action === 'list') {
      // Fetch articles for this supplier
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, name, description, sku, unit, price, category, is_active')
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .order('name');

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        throw articlesError;
      }

      console.log(`Found ${articles?.length || 0} articles for supplier ${supplierId}`);

      return new Response(JSON.stringify({ articles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!articleId || !changes) {
        throw new Error('Missing articleId or changes for update');
      }

      // Update article - verify it belongs to this supplier
      const { data: updatedArticle, error: updateError } = await supabase
        .from('articles')
        .update(changes)
        .eq('id', articleId)
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating article:', updateError);
        throw updateError;
      }

      console.log(`Updated article ${articleId}`);

      return new Response(JSON.stringify({ article: updatedArticle }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in supplier-portal-articles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
