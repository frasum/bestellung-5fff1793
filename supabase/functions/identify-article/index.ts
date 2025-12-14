import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, supplierId, organizationId } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch existing articles for matching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let existingArticles: { id: string; name: string; sku: string | null; category: string | null }[] = [];
    
    if (supplierId && organizationId) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, name, sku, category")
        .eq("organization_id", organizationId)
        .eq("supplier_id", supplierId)
        .eq("is_active", true);
      
      existingArticles = articles || [];
    }

    const articleListForPrompt = existingArticles.length > 0
      ? existingArticles.map(a => `- ID: ${a.id}, Name: "${a.name}"${a.sku ? `, SKU: ${a.sku}` : ""}${a.category ? `, Kategorie: ${a.category}` : ""}`).join("\n")
      : "Keine existierenden Artikel vorhanden.";

    const systemPrompt = `Du bist ein Experte für Lebensmittel- und Restaurantprodukte.
Analysiere das Produktbild und identifiziere so viele Details wie möglich:

1. Produktname (so genau wie möglich basierend auf Verpackung/Label)
2. Ausführliche Beschreibung des Produkts mit allen erkennbaren Details:
   - Bei Wein: Weingut, Rebsorte, Jahrgang, Region, Qualitätsstufe
   - Bei Spirituosen: Destillerie, Alter, Herkunftsland
   - Bei Lebensmitteln: Herkunftsland, Bio-Zertifizierung, spezielle Eigenschaften
   - Allergene falls erkennbar (Gluten, Laktose, Nüsse, etc.)
   - Alkoholgehalt falls erkennbar
3. Passende Kategorie (z.B. Gemüse, Fleisch, Fisch, Getränke, Wein, Spirituosen, Milchprodukte, Gewürze, Öle, Konserven, Tiefkühl, etc.)
4. Geschätzte Einheit (z.B. kg, Stk, L, Dose, Packung, Flasche, etc.)

Vergleiche das erkannte Produkt auch mit diesen existierenden Artikeln und prüfe, ob es eine Übereinstimmung gibt:
${articleListForPrompt}

Antworte NUR im folgenden JSON-Format (keine zusätzlichen Erklärungen):
{
  "matched_article_id": "UUID des gematchten Artikels oder null",
  "matched_article_name": "Name des gematchten Artikels oder null",
  "confidence": "high" | "medium" | "low",
  "suggested_name": "Erkannter/Vorgeschlagener Produktname",
  "suggested_description": "Ausführliche Produktbeschreibung mit allen erkannten Details (Jahrgang, Weingut, Allergene, Alkoholgehalt etc.)",
  "suggested_category": "Passende Kategorie",
  "suggested_unit": "Einheit (z.B. kg, Stk, L, Flasche)",
  "suggested_origin_country": "Herkunftsland des Produkts (z.B. Deutschland, Italien, Frankreich, Spanien) oder null"
}

Wichtig:
- Nur "matched_article_id" setzen, wenn du SEHR sicher bist (>80% Übereinstimmung mit einem existierenden Artikel)
- "confidence" bezieht sich auf deine Sicherheit bei der Produkterkennung
- Bei unleserlichen/unscharfen Bildern: confidence=low und bestmögliche Schätzung
- In "suggested_description" alle erkennbaren Produktdetails zusammenfassen (Weingut, Jahrgang, Herkunft, Allergene, Alkohol, etc.)`;

    console.log("Calling Lovable AI for image identification...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analysiere dieses Produktbild und identifiziere den Artikel:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("AI response content:", content);

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      // Return a default response if parsing fails
      result = {
        matched_article_id: null,
        matched_article_name: null,
        confidence: "low",
        suggested_name: "Unbekanntes Produkt",
        suggested_description: "",
        suggested_category: "",
        suggested_unit: "Stk"
      };
    }

    console.log("Parsed result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in identify-article:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
