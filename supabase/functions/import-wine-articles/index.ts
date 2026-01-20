import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WineData {
  name: string;
  winery?: string;
  grape_variety?: string;
  price_075l?: number;
  aromas?: string;
  taste?: string;
  special_attributes?: string;
  country?: string;
}

interface ImportRequest {
  wines: WineData[];
  organization_id: string;
  supplier_id: string;
  dryRun?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { wines, organization_id, supplier_id, dryRun = false }: ImportRequest = await req.json();

    if (!wines || !Array.isArray(wines) || wines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No wines provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!organization_id || !supplier_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id and supplier_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${wines.length} wines for import`);
    console.log(`Organization: ${organization_id}, Supplier: ${supplier_id}`);
    console.log(`Dry run: ${dryRun}`);

    interface ArticleData {
      organization_id: string;
      supplier_id: string;
      name: string;
      description: string;
      grape_variety: string | null;
      selling_price: number | null;
      flavor_profile: string | null;
      special_attributes: string | null;
      origin_country: string | null;
      category: string;
      unit: string;
      price: number;
      is_active: boolean;
    }

    const results = {
      total: wines.length,
      created: 0,
      skipped: 0,
      errors: [] as string[],
      articles: [] as ArticleData[],
    };

    for (const wine of wines) {
      try {
        // Build flavor_profile from aromas and taste
        let flavorProfile = '';
        if (wine.aromas) {
          flavorProfile += wine.aromas;
        }
        if (wine.taste) {
          if (flavorProfile) flavorProfile += '. ';
          flavorProfile += wine.taste;
        }

        // Build description from winery
        const description = wine.winery || '';

        const articleData = {
          organization_id,
          supplier_id,
          name: wine.name,
          description,
          grape_variety: wine.grape_variety || null,
          selling_price: wine.price_075l || null,
          flavor_profile: flavorProfile || null,
          special_attributes: wine.special_attributes || null,
          origin_country: wine.country || null,
          category: 'Wein',
          unit: 'Fl.',
          price: 0,
          is_active: true,
        };

        if (dryRun) {
          results.articles.push(articleData);
          results.created++;
        } else {
          const { data, error } = await supabase
            .from('articles')
            .insert(articleData)
            .select()
            .single();

          if (error) {
            console.error(`Error inserting wine "${wine.name}":`, error);
            results.errors.push(`${wine.name}: ${error.message}`);
          } else {
            results.articles.push(data);
            results.created++;
            console.log(`Created article: ${wine.name}`);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error processing wine "${wine.name}":`, err);
        results.errors.push(`${wine.name}: ${errorMessage}`);
      }
    }

    console.log(`Import complete: ${results.created} created, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
