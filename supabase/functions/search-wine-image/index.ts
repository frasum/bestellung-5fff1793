import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ image_url: null, error: 'Firecrawl API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for wine product photos
    let searchQuery = `${wineName} Weinflasche Produktfoto`;
    if (winery) searchQuery = `${winery} ${searchQuery}`;
    if (origin_country) searchQuery += ` ${origin_country}`;

    console.log('Searching wine image:', searchQuery);

    // Search for wine product images
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
      const errorText = await searchResponse.text();
      console.error('Firecrawl search error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ image_url: null, error: 'Search failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    // Get the first result URL for scraping
    const results = searchData.data || [];
    if (results.length === 0) {
      console.log('No search results found');
      return new Response(
        JSON.stringify({ image_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to scrape the top results for images
    for (const result of results.slice(0, 3)) {
      const pageUrl = result.url;
      if (!pageUrl) continue;

      console.log('Scraping page for images:', pageUrl);

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
            waitFor: 1500,
            actions: [
              // Try common cookie consent button selectors
              { type: 'click', selector: '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll' },
              { type: 'click', selector: '#onetrust-accept-btn-handler' },
              { type: 'click', selector: '[data-action="accept-all"]' },
              { type: 'click', selector: '.accept-all-cookies' },
              { type: 'click', selector: '#accept-all' },
              { type: 'click', selector: '#acceptAll' },
              { type: 'click', selector: 'button[data-consent="accept"]' },
              { type: 'click', selector: '.cookie-consent-accept' },
              { type: 'click', selector: '.klaro .cm-btn-success' },
              { type: 'click', selector: 'a._brlbs-btn' },
              // Wait for cookie banner to close
              { type: 'wait', milliseconds: 800 },
            ],
          }),
        });

        if (!scrapeResponse.ok) {
          console.log('Scrape failed for:', pageUrl);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot;

        if (screenshot) {
          console.log('Found screenshot from:', pageUrl);
          return new Response(
            JSON.stringify({
              image_url: screenshot,
              image_source: pageUrl,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (scrapeError) {
        console.error('Scrape error for', pageUrl, scrapeError);
        continue;
      }
    }

    // No images found
    return new Response(
      JSON.stringify({ image_url: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-wine-image:', error);
    return new Response(
      JSON.stringify({ image_url: null, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
