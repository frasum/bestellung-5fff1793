import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  articleId: string;
  targetLanguage: 'en' | 'th' | 'fr';
}

interface WineContent {
  description: string | null;
  grape_variety: string | null;
  flavor_profile: string | null;
  food_pairings: string | null;
  origin_country: string | null;
}

interface TranslationResult {
  description: string;
  grape_variety: string;
  flavor_profile: string;
  food_pairings: string;
  origin_country: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, targetLanguage }: TranslateRequest = await req.json();

    if (!articleId || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'articleId and targetLanguage are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['en', 'th', 'fr'].includes(targetLanguage)) {
      return new Response(
        JSON.stringify({ error: 'targetLanguage must be "en", "th", or "fr"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('description, grape_variety, flavor_profile, food_pairings, origin_country')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      console.error('Error fetching article:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const wineContent: WineContent = article;

    // Check if there's content to translate
    const hasContent = wineContent.description || wineContent.grape_variety || 
                       wineContent.flavor_profile || wineContent.food_pairings ||
                       wineContent.origin_country;

    if (!hasContent) {
      return new Response(
        JSON.stringify({ error: 'No content to translate', translations: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const languageName = targetLanguage === 'en' ? 'English' : targetLanguage === 'th' ? 'Thai' : 'French';
    const languageInstructions = targetLanguage === 'th' 
      ? 'Translate into natural Thai language. Keep wine grape names in their original form but add Thai phonetic transcription in parentheses if helpful.'
      : targetLanguage === 'fr'
      ? 'Translate into natural French. Use proper French wine terminology. Keep grape variety names in their French forms where applicable (e.g., Pinot Noir, Chardonnay).'
      : 'Translate into natural English. Keep technical wine terms and grape variety names.';

    const prompt = `You are a professional wine translator. Translate the following German wine information into ${languageName}.

${languageInstructions}

IMPORTANT:
- Keep the translations concise and natural
- Preserve wine terminology appropriately
- If a field is empty or null, return an empty string for that field
- Return ONLY valid JSON, no markdown or explanations

Input (German):
- Beschreibung: ${wineContent.description || '(empty)'}
- Traubensorte: ${wineContent.grape_variety || '(empty)'}
- Geschmacksprofil: ${wineContent.flavor_profile || '(empty)'}
- Speiseempfehlungen: ${wineContent.food_pairings || '(empty)'}
- Herkunftsland: ${wineContent.origin_country || '(empty)'}

Return a JSON object with these exact keys:
{
  "description": "translated description or empty string",
  "grape_variety": "translated grape variety or empty string",
  "flavor_profile": "translated flavor profile or empty string",
  "food_pairings": "translated food pairings or empty string",
  "origin_country": "translated origin country or empty string"
}`;

    console.log(`Translating article ${articleId} to ${targetLanguage}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI translation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let translations: TranslationResult;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      translations = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse translation response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the update object based on target language
    const updateData: Record<string, string | null> = {};
    const suffix = `_${targetLanguage}`;
    
    if (translations.description) updateData[`description${suffix}`] = translations.description;
    if (translations.grape_variety) updateData[`grape_variety${suffix}`] = translations.grape_variety;
    if (translations.flavor_profile) updateData[`flavor_profile${suffix}`] = translations.flavor_profile;
    if (translations.food_pairings) updateData[`food_pairings${suffix}`] = translations.food_pairings;
    if (translations.origin_country) updateData[`origin_country${suffix}`] = translations.origin_country;

    // Update the article with translations
    const { error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating article:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save translations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully translated article ${articleId} to ${targetLanguage}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        translations,
        language: targetLanguage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});