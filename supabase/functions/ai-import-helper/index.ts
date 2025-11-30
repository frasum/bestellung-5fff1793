import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  type: 'map_columns' | 'clean_data' | 'categorize';
  headers?: string[];
  targetFields?: { name: string; label: string }[];
  data?: Record<string, string>[];
  existingCategories?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, headers, targetFields, data, existingCategories } = await req.json() as ImportRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Return empty results for invalid inputs instead of calling AI
    if (type === 'map_columns' && (!headers || headers.length === 0)) {
      console.log("No headers provided, returning empty mappings");
      return new Response(JSON.stringify({ result: { mappings: {} } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((type === 'clean_data' || type === 'categorize') && (!data || data.length === 0)) {
      console.log("No data provided, returning empty result");
      return new Response(JSON.stringify({ result: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'map_columns') {
      systemPrompt = `You are a data import assistant. Your task is to map CSV/Excel column headers to target fields.
IMPORTANT: You MUST respond with ONLY a valid JSON object, no explanation text.
Format: { "mappings": { "csv_header": "target_field_name" } }
If a column cannot be mapped, omit it from the mappings.`;
      
      userPrompt = `Map these CSV columns to target fields:

CSV columns: ${JSON.stringify(headers)}

Target fields:
${targetFields?.map(f => `- ${f.name}: ${f.label}`).join('\n')}

Common mappings (German/English):
- "Lieferantenname", "supplier_name", "Supplier", "Lieferant" → supplier
- "E-Mail", "email_address", "Mail", "Email" → email
- "Telefonnummer", "phone_number", "Tel", "Telefon" → phone
- "Artikelname", "Produkt", "article", "Name", "Artikel" → name
- "Beschreibung", "description", "Beschr." → description
- "Preis", "price", "Einzelpreis", "VK", "EK" → price
- "Einheit", "unit", "Mengeneinheit", "ME" → unit
- "Kategorie", "category", "Warengruppe" → category
- "SKU", "Artikelnummer", "Art.Nr.", "ArtNr" → sku
- "Adresse", "address", "Anschrift" → address

Respond with ONLY valid JSON: { "mappings": { ... } }`;
    } 
    else if (type === 'clean_data') {
      systemPrompt = `You are a data cleaning assistant. Clean and standardize the data.
IMPORTANT: You MUST respond with ONLY a valid JSON array, no explanation text.
Corrections:
- Validate and fix email addresses
- Standardize phone numbers
- Fix obvious typos in names
- Replace empty or invalid values with null
- Format prices as numbers (comma to dot)`;
      
      userPrompt = `Clean this data and return ONLY a JSON array:
${JSON.stringify(data?.slice(0, 20), null, 2)}

Respond with ONLY valid JSON array: [ {...}, {...} ]`;
    }
    else if (type === 'categorize') {
      systemPrompt = `You are a categorization assistant for restaurant/food articles. Assign each article a suitable category.
IMPORTANT: You MUST respond with ONLY a valid JSON array, no explanation text.
Format: [{ "index": 0, "category": "CategoryName" }, ...]
Use existing categories when possible, create new ones only if needed.`;
      
      const defaultCategories = ['Fleisch', 'Fisch', 'Gemüse', 'Obst', 'Milchprodukte', 'Getränke', 'Gewürze', 'Backwaren', 'Tiefkühl', 'Konserven', 'Öle & Fette', 'Saucen', 'Reinigung', 'Verpackung', 'Asiatisch', 'Nudeln', 'Reis', 'Tofu', 'Sojasaucen'];
      const categories = existingCategories?.length ? existingCategories : defaultCategories;
      
      // Get the article name from various possible field names
      const getArticleName = (item: Record<string, string>) => {
        return item.name || item.Name || item.Artikelname || item.Artikel || item.Produkt || item.Bezeichnung || Object.values(item)[0] || 'Unknown';
      };
      
      userPrompt = `Categorize these articles:
${data?.slice(0, 50).map((item, i) => `${i}: ${getArticleName(item)}`).join('\n')}

Available categories: ${categories.join(', ')}

You can create new categories if needed. Respond with ONLY valid JSON array: [{"index": 0, "category": "..."}, ...]`;
    }

    console.log(`Processing ${type} request with ${headers?.length || 0} headers, ${data?.length || 0} data items`);

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte später erneut versuchen." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht, bitte Guthaben aufladen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      // Return empty result instead of failing
      const emptyResult = type === 'map_columns' ? { mappings: {} } : [];
      return new Response(JSON.stringify({ result: emptyResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Try to extract JSON object/array directly
      const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1]);
        } catch {
          console.error("Could not parse extracted JSON, returning empty result");
          result = type === 'map_columns' ? { mappings: {} } : [];
        }
      } else {
        console.error("No JSON found in response, returning empty result");
        result = type === 'map_columns' ? { mappings: {} } : [];
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in ai-import-helper:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
