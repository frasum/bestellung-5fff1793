import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WineResearchResult {
  description: string;
  grape_variety: string;
  region: string;
  origin_country: string;
  flavor_profile: string;
  food_pairings: string;
  producer_info: string;
  citations: string[];
  image_url?: string;
  image_source?: string;
}

async function searchWineImage(wineName: string, winery?: string, origin_country?: string): Promise<{ image_url: string | null; image_source?: string }> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    console.log('FIRECRAWL_API_KEY not configured, skipping image search');
    return { image_url: null };
  }

  // Build search query for wine product photos
  let searchQuery = `${wineName} Weinflasche Produktfoto`;
  if (winery) searchQuery = `${winery} ${searchQuery}`;
  if (origin_country) searchQuery += ` ${origin_country}`;

  console.log('Searching wine image:', searchQuery);

  try {
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
      }),
    });

    if (!searchResponse.ok) {
      console.error('Firecrawl search failed:', searchResponse.status);
      return { image_url: null };
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];

    if (results.length === 0) {
      console.log('No search results for image');
      return { image_url: null };
    }

    // Try to scrape top results for screenshot
    for (const result of results.slice(0, 2)) {
      const pageUrl = result.url;
      if (!pageUrl) continue;

      console.log('Scraping for wine image:', pageUrl);

      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['screenshot'],
            waitFor: 2000,
          }),
        });

        if (!scrapeResponse.ok) continue;

        const scrapeData = await scrapeResponse.json();
        const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;

        if (screenshot) {
          console.log('Found wine image from:', pageUrl);
          return { image_url: screenshot, image_source: pageUrl };
        }
      } catch (e) {
        console.error('Scrape error:', e);
        continue;
      }
    }

    return { image_url: null };
  } catch (error) {
    console.error('Image search error:', error);
    return { image_url: null };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wineName, winery, origin_country } = await req.json();
    
    if (!wineName) {
      return new Response(
        JSON.stringify({ error: 'Wine name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query with available context
    let searchQuery = `Wein "${wineName}"`;
    if (winery) searchQuery += ` von ${winery}`;
    if (origin_country) searchQuery += ` aus ${origin_country}`;
    
    console.log('Researching wine:', searchQuery);

    // Start image search in parallel with Perplexity research
    const imageSearchPromise = searchWineImage(wineName, winery, origin_country);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Wein-Experte. Recherchiere detaillierte Informationen über den angefragten Wein und gib die Ergebnisse als strukturiertes JSON zurück.

Antworte NUR mit einem gültigen JSON-Objekt im folgenden Format:
{
  "description": "Ausführliche Beschreibung des Weins (2-3 Sätze)",
  "grape_variety": "Rebsorte(n)",
  "region": "Anbaugebiet/Region/Appellation",
  "origin_country": "Herkunftsland (z.B. Italien, Frankreich, Spanien, Deutschland)",
  "flavor_profile": "Geschmacksprofil (Aromen, Struktur, Tannine)",
  "food_pairings": "Empfohlene Speisebegleitungen",
  "producer_info": "Informationen zum Weingut/Produzenten"
}

Falls keine Informationen gefunden werden, setze den Wert auf "Keine Informationen gefunden".`
          },
          {
            role: 'user',
            content: `Recherchiere detaillierte Informationen über: ${searchQuery}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to research wine information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Perplexity response:', JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Wait for image search result
    const imageResult = await imageSearchPromise;
    console.log('Image search result:', imageResult.image_url ? 'Found' : 'Not found');

    // Parse the JSON response from the model
    let wineInfo: WineResearchResult;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      wineInfo = {
        description: parsed.description || 'Keine Informationen gefunden',
        grape_variety: parsed.grape_variety || 'Keine Informationen gefunden',
        region: parsed.region || 'Keine Informationen gefunden',
        origin_country: parsed.origin_country || 'Keine Informationen gefunden',
        flavor_profile: parsed.flavor_profile || 'Keine Informationen gefunden',
        food_pairings: parsed.food_pairings || 'Keine Informationen gefunden',
        producer_info: parsed.producer_info || 'Keine Informationen gefunden',
        citations: citations,
        image_url: imageResult.image_url || undefined,
        image_source: imageResult.image_source,
      };
    } catch (parseError) {
      console.error('Error parsing wine info:', parseError);
      console.log('Raw content:', content);
      // Fallback: use raw content as description
      wineInfo = {
        description: content,
        grape_variety: 'Keine Informationen gefunden',
        region: 'Keine Informationen gefunden',
        origin_country: 'Keine Informationen gefunden',
        flavor_profile: 'Keine Informationen gefunden',
        food_pairings: 'Keine Informationen gefunden',
        producer_info: 'Keine Informationen gefunden',
        citations: citations,
        image_url: imageResult.image_url || undefined,
        image_source: imageResult.image_source,
      };
    }

    return new Response(
      JSON.stringify(wineInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in research-wine function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
