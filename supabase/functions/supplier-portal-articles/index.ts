import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleUpdateRequest {
  action: 'list' | 'update' | 'get-settings';
  supplierId: string;
  organizationId: string;
  sessionToken: string; // Required session token for authentication
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
    const { action, supplierId, organizationId, sessionToken, articleId, changes } = body;

    console.log(`Supplier portal request: action=${action}, supplierId=${supplierId}`);

    // Validate required parameters
    if (!supplierId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing supplierId or organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate session token
    if (!sessionToken) {
      console.error('No session token provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify session token matches the supplier
    // Session token format: supplierId:organizationId:timestamp:randomHash
    // We validate that the token contains the correct supplierId and organizationId
    const tokenParts = sessionToken.split(':');
    if (tokenParts.length < 3) {
      console.error('Invalid session token format');
      return new Response(
        JSON.stringify({ error: 'Invalid session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [tokenSupplierId, tokenOrgId, tokenTimestamp] = tokenParts;
    
    // Validate token matches the requested supplier and organization
    if (tokenSupplierId !== supplierId || tokenOrgId !== organizationId) {
      console.error('Session token does not match supplier/organization');
      return new Response(
        JSON.stringify({ error: 'Session token mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token is not too old (24 hours max session)
    const tokenAge = Date.now() - parseInt(tokenTimestamp, 10);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (isNaN(tokenAge) || tokenAge > maxTokenAge) {
      console.error('Session token expired');
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Invalid supplier or organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle get-settings action
    if (action === 'get-settings') {
      const { data: settings, error: settingsError } = await supabase
        .from('supplier_portal_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching portal settings:', settingsError);
      }

      // Return settings or defaults
      const portalSettings = settings || {
        portal_title: 'Lieferantenportal',
        welcome_message: null,
        card_title: 'Meine Artikel',
        card_description: 'Änderungen werden zur Genehmigung eingereicht.',
        info_text: null,
        footer_text: null,
      };

      console.log('Returning portal settings for organization:', organizationId);

      return new Response(JSON.stringify({ settings: portalSettings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        return new Response(
          JSON.stringify({ error: 'Missing articleId or changes for update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        return new Response(
          JSON.stringify({ error: 'Article not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create pending change records for each changed field
      const changeRecords = [];
      for (const [field, newValue] of Object.entries(changes)) {
        const oldValue = currentArticle[field];
        
        // For price field, compare as numbers to avoid floating point string issues
        let hasChanged = false;
        if (field === 'price') {
          const oldNum = oldValue !== null && oldValue !== undefined ? Number(oldValue) : null;
          const newNum = newValue !== null && newValue !== undefined ? Number(newValue) : null;
          hasChanged = oldNum !== newNum;
        } else {
          // For other fields, compare as strings
          const oldStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
          const newStr = newValue !== null && newValue !== undefined ? String(newValue) : null;
          hasChanged = oldStr !== newStr;
        }
        
        if (hasChanged) {
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

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in supplier-portal-articles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
