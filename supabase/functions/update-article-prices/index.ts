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
    const { supplierId, dryRun = false } = await req.json();

    console.log(`Updating article prices from invoices for org ${organizationId}, supplier: ${supplierId || 'all'}, dryRun: ${dryRun}`);

    // Get articles with price = 0 (or null)
    let articlesQuery = supabaseClient
      .from('articles')
      .select('id, name, sku, price, supplier_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or('price.eq.0,price.is.null');

    if (supplierId) {
      articlesQuery = articlesQuery.eq('supplier_id', supplierId);
    }

    const { data: articles, error: articlesError } = await articlesQuery;

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch articles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${articles?.length || 0} articles with price 0 or null`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No articles need price updates',
        updatedCount: 0,
        updates: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get invoice items that might match these articles
    const { data: invoiceItems, error: itemsError } = await supabaseClient
      .from('invoice_items')
      .select(`
        id,
        article_name,
        article_sku,
        unit_price,
        invoice_id,
        matched_article_id,
        invoices!inner(organization_id, supplier_id, status)
      `)
      .eq('invoices.organization_id', organizationId)
      .gt('unit_price', 0)
      .order('invoice_id', { ascending: false }); // Newer invoices first

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch invoice items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${invoiceItems?.length || 0} invoice items with prices`);

    // Helper function for fuzzy matching
    const normalizeForMatch = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const getTokens = (str: string): string[] => {
      return normalizeForMatch(str).split(' ').filter(t => t.length >= 3);
    };

    const calculateSimilarity = (name1: string, name2: string): number => {
      const tokens1 = getTokens(name1);
      const tokens2 = getTokens(name2);
      
      if (tokens1.length === 0 || tokens2.length === 0) return 0;
      
      let matches = 0;
      for (const t1 of tokens1) {
        for (const t2 of tokens2) {
          if (t1 === t2 || (t1.length >= 5 && t2.length >= 5 && (t1.includes(t2) || t2.includes(t1)))) {
            matches++;
            break;
          }
        }
      }
      
      return (matches / Math.max(tokens1.length, tokens2.length)) * 100;
    };

    // Match articles to invoice items and find prices
    const updates: Array<{
      articleId: string;
      articleName: string;
      oldPrice: number;
      newPrice: number;
      matchedFrom: string;
      matchType: string;
    }> = [];

    for (const article of articles) {
      let bestMatch: { price: number; from: string; type: string } | null = null;

      for (const item of invoiceItems || []) {
        // Skip if invoice is for different supplier (when we know the supplier)
        const invoiceData = item.invoices as any;
        if (supplierId && invoiceData?.supplier_id && invoiceData.supplier_id !== article.supplier_id) {
          continue;
        }

        // Check if already matched by invoice processing
        if (item.matched_article_id === article.id) {
          bestMatch = { 
            price: item.unit_price, 
            from: item.article_name, 
            type: 'exact (previously matched)' 
          };
          break; // Already matched, use this price
        }

        // Try SKU match first
        if (article.sku && item.article_sku) {
          const normalizedArticleSku = article.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedItemSku = item.article_sku.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (normalizedArticleSku === normalizedItemSku) {
            bestMatch = { 
              price: item.unit_price, 
              from: item.article_name, 
              type: 'SKU match' 
            };
            break;
          }
        }

        // Try name similarity
        const similarity = calculateSimilarity(article.name, item.article_name);
        if (similarity >= 70) {
          if (!bestMatch) {
            bestMatch = { 
              price: item.unit_price, 
              from: item.article_name, 
              type: `name similarity (${Math.round(similarity)}%)` 
            };
          }
        }
      }

      if (bestMatch) {
        updates.push({
          articleId: article.id,
          articleName: article.name,
          oldPrice: article.price || 0,
          newPrice: bestMatch.price,
          matchedFrom: bestMatch.from,
          matchType: bestMatch.type,
        });
      }
    }

    console.log(`Found ${updates.length} articles with price matches`);

    // Apply updates if not dry run
    let updatedCount = 0;
    if (!dryRun && updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabaseClient
          .from('articles')
          .update({ price: update.newPrice })
          .eq('id', update.articleId);

        if (updateError) {
          console.error(`Error updating article ${update.articleId}:`, updateError);
        } else {
          updatedCount++;

          // Log price change
          await supabaseClient
            .from('article_price_history')
            .insert({
              article_id: update.articleId,
              organization_id: organizationId,
              old_price: update.oldPrice,
              new_price: update.newPrice,
              change_source: 'invoice_sync',
              changed_by: user.id,
            });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      updatedCount: dryRun ? 0 : updatedCount,
      potentialUpdates: updates.length,
      updates: updates.slice(0, 50), // Limit response size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Price update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
