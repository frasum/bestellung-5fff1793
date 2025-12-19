import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KroeswangProduct {
  name: string;
  price: string;
  unit: string;
  articleNumber: string;
  category: string;
  description?: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, searchTerm, limit = 20 } = await req.json();

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query based on category and search term
    const categoryMap: Record<string, string> = {
      'fleisch': 'Fleisch Rind Schwein',
      'gefluegel': 'Geflügel Huhn Pute Ente',
      'fisch': 'Fisch Meeresfrüchte',
      'wild': 'Wild Wildfleisch Hirsch Reh',
      'wurst': 'Wurst Schinken Aufschnitt',
      'convenience': 'Convenience Fertigprodukte',
      'tiefkuehl': 'Tiefkühl TK-Produkte',
      'molkerei': 'Molkerei Milch Käse Butter',
    };

    const categoryKeywords = categoryMap[category?.toLowerCase()] || category || 'Fleisch';
    
    // Prioritize search term over category keywords for focused results
    const searchQuery = searchTerm || categoryKeywords;
    const searchContext = searchTerm 
      ? `Suche GENAU nach "${searchTerm}" Produkten`
      : `Suche nach ${categoryKeywords} Produkten`;

    console.log(`Searching Kröswang catalog for: ${searchQuery} (context: ${searchContext})`);

    // Use Perplexity to search kroeswang.at
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Produkt-Recherche-Assistent. Suche auf kroeswang.at nach Produkten und extrahiere die Informationen als strukturiertes JSON.

WICHTIG: 
- Gib NUR valides JSON zurück, ohne Markdown-Formatierung oder zusätzlichen Text.
- Zeige NUR Produkte die DIREKT zum Suchbegriff passen.
- Wenn nach "Huhn" gesucht wird, zeige NUR Huhn-Produkte, KEINE Rind- oder Schweinefleisch-Produkte.

Für jedes gefundene Produkt gib zurück:
- name: Produktname
- price: Preis (z.B. "12,50 €/kg" oder "25,90 €/Stk")
- unit: Einheit (kg, Stk, Pkg, etc.)
- articleNumber: Artikelnummer falls verfügbar
- category: Produktkategorie
- description: Kurze Beschreibung falls verfügbar

Antworte AUSSCHLIESSLICH mit einem JSON-Array wie folgt:
[{"name":"Produktname","price":"12,50 €/kg","unit":"kg","articleNumber":"12345","category":"Fleisch","description":"Kurze Beschreibung"}]`
          },
          {
            role: 'user',
            content: `${searchContext} auf kroeswang.at. Gib mir bis zu ${limit} Ergebnisse.

WICHTIG: Zeige NUR Produkte die DIREKT mit "${searchQuery}" zu tun haben. Keine anderen Produkte!`
          }
        ],
        search_domain_filter: ['kroeswang.at'],
        temperature: 0.1,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Perplexity API error: ${perplexityResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    const content = perplexityData.choices?.[0]?.message?.content || '';
    const citations = perplexityData.citations || [];

    console.log('Perplexity response:', content.substring(0, 500));

    // Try to parse the JSON response
    let products: KroeswangProduct[] = [];
    
    try {
      // Remove any markdown code blocks if present
      let jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Try to find JSON array in the response
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array found, try to parse the entire content
        const parsed = JSON.parse(jsonContent);
        products = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (parseError) {
      console.log('Could not parse JSON directly, using Lovable AI to structure the response');
      
      // Use Lovable AI to structure the response
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (lovableApiKey) {
        const structureResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Extrahiere Produktinformationen aus dem Text und gib sie als JSON-Array zurück.
Jedes Produkt sollte diese Felder haben: name, price, unit, articleNumber, category, description.
Gib NUR valides JSON zurück, ohne zusätzlichen Text.`
              },
              {
                role: 'user',
                content: `Extrahiere die Produkte aus folgendem Text:\n\n${content}`
              }
            ],
          }),
        });

        if (structureResponse.ok) {
          const structureData = await structureResponse.json();
          const structuredContent = structureData.choices?.[0]?.message?.content || '';
          
          try {
            const cleanedContent = structuredContent
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();
            const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              products = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error('Failed to parse structured response:', e);
          }
        }
      }
    }

    // Validate and clean up products
    products = products
      .filter(p => p && p.name)
      .map(p => ({
        name: p.name || 'Unbekannt',
        price: p.price || 'Preis auf Anfrage',
        unit: p.unit || 'Stk',
        articleNumber: p.articleNumber || '',
        category: p.category || category || 'Allgemein',
        description: p.description || '',
        url: `https://kroeswang.at/suche?q=${encodeURIComponent(p.name)}`,
      }))
      .slice(0, limit);

    console.log(`Found ${products.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        products,
        citations,
        searchQuery,
        source: 'kroeswang.at',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching Kröswang catalog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
