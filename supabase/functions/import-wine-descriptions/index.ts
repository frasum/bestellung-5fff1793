import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedWine {
  name: string;
  description?: string;
  grape_variety?: string;
  origin_country?: string;
  flavor_profile?: string;
  food_pairings?: string;
}

interface MatchResult {
  extracted: ExtractedWine;
  matchedArticle?: {
    id: string;
    name: string;
  };
  confidence: 'high' | 'medium' | 'low' | 'none';
  updated?: boolean;
}

// Simple fuzzy matching function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  
  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchingWords = 0;
  for (const w1 of words1) {
    if (w1.length < 3) continue;
    for (const w2 of words2) {
      if (w2.length < 3) continue;
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchingWords++;
        break;
      }
    }
  }
  
  const totalSignificantWords = Math.max(
    words1.filter(w => w.length >= 3).length,
    words2.filter(w => w.length >= 3).length
  );
  
  if (totalSignificantWords === 0) return 0;
  
  return matchingWords / totalSignificantWords;
}

function getConfidenceLevel(similarity: number): 'high' | 'medium' | 'low' | 'none' {
  if (similarity >= 0.8) return 'high';
  if (similarity >= 0.5) return 'medium';
  if (similarity >= 0.3) return 'low';
  return 'none';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageImages, organizationId, dryRun = true } = await req.json();

    if (!pageImages || !Array.isArray(pageImages) || pageImages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'pageImages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'organizationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing wine articles for matching
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, name, description, grape_variety, origin_country, flavor_profile, food_pairings, category, top_category')
      .eq('organization_id', organizationId)
      .or('category.ilike.%wein%,top_category.ilike.%wein%,category.ilike.%wine%,top_category.ilike.%wine%');

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw new Error('Failed to fetch articles');
    }

    console.log(`Found ${articles?.length || 0} wine articles for matching`);

    // Process each page with AI Vision
    const allExtractedWines: ExtractedWine[] = [];

    for (let i = 0; i < pageImages.length; i++) {
      const pageImage = pageImages[i];
      console.log(`Processing page ${i + 1} of ${pageImages.length}`);

      const systemPrompt = `Du bist ein Experte für Weinkarten-Analyse. Analysiere das Bild einer Weinkarte und extrahiere alle Weine mit ihren Beschreibungen.

Für jeden Wein extrahiere:
- name: Der vollständige Name des Weins (inkl. Weingut wenn vorhanden)
- description: Die Beschreibung/Degustationsnotiz aus der Weinkarte
- grape_variety: Die Rebsorte(n) falls angegeben
- origin_country: Das Herkunftsland falls angegeben
- flavor_profile: Geschmacksbeschreibung falls angegeben
- food_pairings: Speiseempfehlungen falls angegeben

WICHTIG:
- Extrahiere NUR Weine die eine Beschreibung haben
- Ignoriere reine Preislisten ohne Beschreibungen
- Behalte den originalen Text der Beschreibungen bei
- Antworte IMMER mit einem gültigen JSON-Array

Antwortformat (JSON-Array):
[
  {
    "name": "Weingut Müller Riesling Spätlese",
    "description": "Ein eleganter Riesling mit Noten von...",
    "grape_variety": "Riesling",
    "origin_country": "Deutschland",
    "flavor_profile": "Frisch, fruchtig, mineralisch",
    "food_pairings": "Fisch, Meeresfrüchte"
  }
]`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: pageImage.startsWith('data:') ? pageImage : `data:image/png;base64,${pageImage}`
                    }
                  },
                  {
                    type: 'text',
                    text: 'Analysiere diese Seite der Weinkarte und extrahiere alle Weine mit Beschreibungen als JSON-Array.'
                  }
                ]
              }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI API error for page ${i + 1}:`, response.status, errorText);
          continue;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        let extractedWines: ExtractedWine[] = [];
        try {
          // Try to extract JSON from markdown code blocks or raw JSON
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            extractedWines = JSON.parse(jsonStr);
          }
        } catch (parseError) {
          console.error(`Error parsing AI response for page ${i + 1}:`, parseError);
          console.log('Raw content:', content);
        }

        if (Array.isArray(extractedWines)) {
          allExtractedWines.push(...extractedWines);
          console.log(`Extracted ${extractedWines.length} wines from page ${i + 1}`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
      }
    }

    console.log(`Total extracted wines: ${allExtractedWines.length}`);

    // Match extracted wines to database articles
    const results: MatchResult[] = [];

    for (const extracted of allExtractedWines) {
      let bestMatch: { article: typeof articles[0]; similarity: number } | null = null;

      for (const article of articles || []) {
        const similarity = calculateSimilarity(extracted.name, article.name);
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { article, similarity };
        }
      }

      const confidence = bestMatch ? getConfidenceLevel(bestMatch.similarity) : 'none';
      
      const result: MatchResult = {
        extracted,
        confidence,
      };

      if (bestMatch && confidence !== 'none') {
        result.matchedArticle = {
          id: bestMatch.article.id,
          name: bestMatch.article.name,
        };

        // Update database if not dry run and confidence is high/medium
        if (!dryRun && (confidence === 'high' || confidence === 'medium')) {
          const updateData: Record<string, string> = {};
          
          if (extracted.description) updateData.description = extracted.description;
          if (extracted.grape_variety) updateData.grape_variety = extracted.grape_variety;
          if (extracted.origin_country) updateData.origin_country = extracted.origin_country;
          if (extracted.flavor_profile) updateData.flavor_profile = extracted.flavor_profile;
          if (extracted.food_pairings) updateData.food_pairings = extracted.food_pairings;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('articles')
              .update(updateData)
              .eq('id', bestMatch.article.id);

            if (updateError) {
              console.error(`Error updating article ${bestMatch.article.id}:`, updateError);
            } else {
              result.updated = true;
              console.log(`Updated article: ${bestMatch.article.name}`);
            }
          }
        }
      }

      results.push(result);
    }

    const stats = {
      totalExtracted: allExtractedWines.length,
      highConfidence: results.filter(r => r.confidence === 'high').length,
      mediumConfidence: results.filter(r => r.confidence === 'medium').length,
      lowConfidence: results.filter(r => r.confidence === 'low').length,
      noMatch: results.filter(r => r.confidence === 'none').length,
      updated: results.filter(r => r.updated).length,
    };

    console.log('Import stats:', stats);

    return new Response(
      JSON.stringify({ results, stats, dryRun }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-wine-descriptions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
