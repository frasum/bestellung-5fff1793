import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Article {
  id: string;
  name: string;
  price: number;
  category: string | null;
  unit: string;
  supplier_name?: string;
}

interface PriceResult {
  article_id: string;
  article_name: string;
  article_category: string | null;
  search_query: string;
  found_price: number;
  found_supplier: string;
  source_url: string | null;
  current_price: number;
  savings_percent: number;
  savings_amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!perplexityKey) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Perplexity API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { organization_id, category_filter, max_articles } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: "organization_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting price search for organization: ${organization_id}`);

    // Get price watch settings
    const { data: settings } = await supabase
      .from("price_watch_settings")
      .select("*")
      .eq("organization_id", organization_id)
      .single();

    const minSavingsPercent = settings?.min_savings_percent || 5;
    const searchRadiusKm = settings?.search_radius_km || 50;
    const enabledCategories = settings?.categories || [];

    // Get location for geo-context
    const { data: locations } = await supabase
      .from("locations")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_default", true)
      .limit(1);

    const { data: addresses } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_default", true)
      .limit(1);

    const location = locations?.[0];
    const address = addresses?.[0];
    const city = address?.city || "Deutschland";
    const postalCode = address?.postal_code || "";
    const country = address?.country || "";
    
    // Detect if organization is in Austria (AT country code or Austrian postal code format 1xxx-9xxx)
    const isAustria = country.toUpperCase() === "AT" || 
                      country.toLowerCase().includes("österreich") ||
                      country.toLowerCase().includes("austria") ||
                      /^[1-9]\d{3}$/.test(postalCode);

    console.log(`Search context: ${city} (${postalCode}), country: ${country}, isAustria: ${isAustria}, radius: ${searchRadiusKm}km`);

    // Get articles to search for
    let query = supabase
      .from("articles")
      .select(`
        id,
        name,
        price,
        category,
        unit,
        suppliers!inner(name)
      `)
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .gt("price", 0);

    if (category_filter) {
      query = query.eq("category", category_filter);
    }

    const { data: articles, error: articlesError } = await query.limit(max_articles || 20);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      throw articlesError;
    }

    if (!articles || articles.length === 0) {
      console.log("No articles found to search");
      return new Response(
        JSON.stringify({ success: true, results: [], message: "No articles to search" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${articles.length} articles to search`);

    const results: PriceResult[] = [];

    // Process articles in batches
    for (const article of articles) {
      const supplierName = (article as any).suppliers?.name || "";
      
      // Build search query - include B2B, retail and online sources
      const searchQuery = `${article.name} Preis ${city} kaufen Großhandel Supermarkt Online`;
      
      console.log(`Searching: ${searchQuery}`);

      try {
        // Call Perplexity API
        const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: `Du bist ein Preisrecherche-Assistent für Gastronomiebetriebe und Unternehmen.
                Suche nach den günstigsten Preisen aus ALLEN verfügbaren Quellen:
                
                B2B-GROSSHANDEL DEUTSCHLAND: Metro, Selgros, Transgourmet, Chefs Culinar, Rungis Express
                B2B-GROSSHANDEL ÖSTERREICH: Kröswang (kroeswang.at), Kastner, AGM, Wedl, PFEIFFER, C+C Pfeiffer
                CASH & CARRY: Hamberger, Handelshof, Ratio, Metro Cash & Carry
                SUPERMARKTKETTEN DEUTSCHLAND: Aldi, Lidl, Rewe, Edeka, Kaufland, Penny, Netto
                SUPERMARKTKETTEN ÖSTERREICH: Hofer, Billa, Spar, Interspar, Merkur, Eurospar
                ONLINE-HÄNDLER: Amazon, eBay, Otto, idealo, geizhals.at, geizhals.de, billiger.de
                SPEZIALHÄNDLER: Getränkehändler, Weingroßhandel, Fleischgroßhändler
                
                Antworte NUR mit einem JSON-Objekt im Format:
                {
                  "found": true/false,
                  "price": number (Preis pro Einheit in Euro, ohne Währungszeichen),
                  "supplier": "Name des Lieferanten/Händlers",
                  "supplier_type": "B2B" | "Supermarkt" | "Online",
                  "source_url": "URL der Quelle falls vorhanden",
                  "unit": "Einheit",
                  "notes": "Zusätzliche Infos (z.B. Mindestbestellmenge)"
                }
                Falls kein Preis gefunden wurde, setze "found" auf false.`
              },
              {
                role: "user",
                content: isAustria 
                  ? `Finde den günstigsten Preis für: "${article.name}" (Einheit: ${article.unit})
                Region: ${city} ${postalCode} ÖSTERREICH
                Suche PRIORITÄR in: Kröswang, Kastner, AGM, Wedl, PFEIFFER, C+C Pfeiffer, Metro Österreich
                Auch suchen in: Hofer, Billa, Spar, Interspar UND Online-Händler (geizhals.at, Amazon.at)
                Aktueller Einkaufspreis: ${article.price}€ pro ${article.unit}`
                  : `Finde den günstigsten Preis für: "${article.name}" (Einheit: ${article.unit})
                Region: ${city} ${postalCode}
                Suche in: B2B-Großhandel (Metro, Selgros, Transgourmet), Supermarktketten (Aldi, Lidl, Rewe, Edeka, Kaufland) UND Online-Händler
                Aktueller Einkaufspreis: ${article.price}€ pro ${article.unit}`
              }
            ],
            max_tokens: 500,
          }),
        });

        if (!perplexityResponse.ok) {
          console.error(`Perplexity API error for ${article.name}:`, await perplexityResponse.text());
          continue;
        }

        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices?.[0]?.message?.content;
        const citations = perplexityData.citations || [];

        console.log(`Perplexity response for ${article.name}:`, content);

        // Parse the response - try to extract JSON
        let priceInfo: any = null;
        try {
          // Try to find JSON in the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            priceInfo = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.log(`Could not parse JSON from response for ${article.name}, trying AI extraction`);
          
          // Use Lovable AI to extract price info
          if (lovableApiKey) {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: `Extrahiere Preisinformationen aus dem Text. Antworte NUR mit JSON:
                    {"found": boolean, "price": number, "supplier": string, "source_url": string|null}`
                  },
                  {
                    role: "user",
                    content: `Text: ${content}\n\nExtrahiere den günstigsten Preis für "${article.name}"`
                  }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const aiContent = aiData.choices?.[0]?.message?.content;
              const aiJsonMatch = aiContent?.match(/\{[\s\S]*\}/);
              if (aiJsonMatch) {
                priceInfo = JSON.parse(aiJsonMatch[0]);
              }
            }
          }
        }

        if (priceInfo?.found && priceInfo.price && priceInfo.price > 0) {
          const foundPrice = parseFloat(priceInfo.price);
          const currentPrice = parseFloat(String(article.price));
          
          if (foundPrice < currentPrice) {
            const savingsAmount = currentPrice - foundPrice;
            const savingsPercent = (savingsAmount / currentPrice) * 100;
            
            if (savingsPercent >= minSavingsPercent) {
              results.push({
                article_id: article.id,
                article_name: article.name,
                article_category: article.category,
                search_query: searchQuery,
                found_price: foundPrice,
                found_supplier: priceInfo.supplier || "Unbekannt",
                source_url: priceInfo.source_url || citations[0] || null,
                current_price: currentPrice,
                savings_percent: Math.round(savingsPercent * 100) / 100,
                savings_amount: Math.round(savingsAmount * 100) / 100,
              });
              
              console.log(`Found cheaper price for ${article.name}: ${foundPrice}€ vs ${currentPrice}€ (${savingsPercent.toFixed(1)}% savings)`);
            }
          }
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (searchError) {
        console.error(`Error searching for ${article.name}:`, searchError);
        continue;
      }
    }

    console.log(`Found ${results.length} cheaper alternatives`);

    // Save results to database
    if (results.length > 0) {
      const resultsToInsert = results.map(r => ({
        organization_id,
        article_id: r.article_id,
        article_name: r.article_name,
        article_category: r.article_category,
        search_query: r.search_query,
        found_price: r.found_price,
        found_supplier: r.found_supplier,
        source_url: r.source_url,
        current_price: r.current_price,
        savings_percent: r.savings_percent,
        savings_amount: r.savings_amount,
      }));

      const { error: insertError } = await supabase
        .from("price_watch_results")
        .insert(resultsToInsert);

      if (insertError) {
        console.error("Error inserting results:", insertError);
      } else {
        console.log(`Inserted ${resultsToInsert.length} results`);
        
        // Create alerts for all users in the organization
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("organization_id", organization_id);

        if (profiles && profiles.length > 0) {
          // Get the inserted result IDs
          const { data: insertedResults } = await supabase
            .from("price_watch_results")
            .select("id")
            .eq("organization_id", organization_id)
            .order("created_at", { ascending: false })
            .limit(resultsToInsert.length);

          if (insertedResults) {
            const alertsToInsert = [];
            for (const profile of profiles) {
              for (const result of insertedResults) {
                alertsToInsert.push({
                  organization_id,
                  user_id: profile.id,
                  result_id: result.id,
                });
              }
            }

            if (alertsToInsert.length > 0) {
              const { error: alertError } = await supabase
                .from("price_watch_alerts")
                .insert(alertsToInsert);
              
              if (alertError) {
                console.error("Error creating alerts:", alertError);
              } else {
                console.log(`Created ${alertsToInsert.length} alerts`);
              }
            }
          }
        }
      }
    }

    // Update settings with last search info
    await supabase
      .from("price_watch_settings")
      .upsert({
        organization_id,
        last_search_at: new Date().toISOString(),
        last_search_results_count: results.length,
      }, { onConflict: "organization_id" });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results_count: results.length,
        results,
        searched_articles: articles.length,
        search_context: { city, postal_code: postalCode, radius_km: searchRadiusKm }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in search-price-alternatives:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
