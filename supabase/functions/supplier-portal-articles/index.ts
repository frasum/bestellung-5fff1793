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

      // Fetch pending changes for this supplier
      const { data: pendingChanges, error: pendingError } = await supabase
        .from('supplier_article_changes')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Error fetching pending changes:', pendingError);
      }

      console.log(`Found ${articles?.length || 0} articles for supplier ${supplierId}`);

      return new Response(JSON.stringify({ 
        articles, 
        pendingChanges: pendingChanges || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!articleId || !changes) {
        throw new Error('Missing articleId or changes for update');
      }

      // Fetch the current article to get old values
      const { data: currentArticle, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError || !currentArticle) {
        console.error('Error fetching article:', fetchError);
        throw new Error('Article not found');
      }

      // Create pending change records for each changed field
      const changeRecords = [];
      for (const [field, newValue] of Object.entries(changes)) {
        const oldValue = currentArticle[field];
        
        // Only create a record if the value actually changed
        if (String(oldValue) !== String(newValue)) {
          changeRecords.push({
            supplier_id: supplierId,
            organization_id: organizationId,
            article_id: articleId,
            field_name: field,
            old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
            new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
            status: 'pending',
          });
        }
      }

      if (changeRecords.length === 0) {
        return new Response(JSON.stringify({ 
          message: 'No changes detected',
          pendingChanges: [] 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete any existing pending changes for this article's fields
      const fieldsToUpdate = changeRecords.map(c => c.field_name);
      await supabase
        .from('supplier_article_changes')
        .delete()
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .in('field_name', fieldsToUpdate);

      // Insert the new pending changes
      const { data: insertedChanges, error: insertError } = await supabase
        .from('supplier_article_changes')
        .insert(changeRecords)
        .select();

      if (insertError) {
        console.error('Error inserting changes:', insertError);
        throw insertError;
      }

      console.log(`Created ${insertedChanges?.length || 0} pending change(s) for article ${articleId}`);

      return new Response(JSON.stringify({ 
        message: 'Änderungen zur Genehmigung eingereicht',
        pendingChanges: insertedChanges 
      }), {
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
