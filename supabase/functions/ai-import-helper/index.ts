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

    let systemPrompt = "";
    let userPrompt = "";

    if (type === 'map_columns') {
      systemPrompt = `Du bist ein Datenimport-Assistent. Deine Aufgabe ist es, CSV/Excel-Spaltenüberschriften den korrekten Zielfeldern zuzuordnen.
Antworte NUR mit einem JSON-Objekt im Format: { "mappings": { "csv_header": "target_field_name" } }
Wenn eine Spalte nicht zugeordnet werden kann, lasse sie weg.`;
      
      userPrompt = `Ordne diese CSV-Spalten den Zielfeldern zu:

CSV-Spalten: ${JSON.stringify(headers)}

Zielfelder:
${targetFields?.map(f => `- ${f.name}: ${f.label}`).join('\n')}

Beispiele für Zuordnungen:
- "Lieferantenname", "supplier_name", "Supplier" → name
- "E-Mail", "email_address", "Mail" → email
- "Telefonnummer", "phone_number", "Tel" → phone
- "Artikelname", "Produkt", "article" → name
- "Preis", "price", "Einzelpreis" → price
- "Einheit", "unit", "Mengeneinheit" → unit
- "Kategorie", "category", "Warengruppe" → category`;
    } 
    else if (type === 'clean_data') {
      systemPrompt = `Du bist ein Datenbereinigung-Assistent. Korrigiere und standardisiere die Daten.
Antworte NUR mit einem JSON-Array der bereinigten Datensätze.
Korrekturen:
- E-Mail-Adressen validieren und korrigieren (z.B. fehlende @ oder .de/.com)
- Telefonnummern standardisieren (Format: +49 xxx xxxxxxx oder 0xxx xxxxxxxx)
- Offensichtliche Tippfehler in Namen korrigieren
- Leere oder ungültige Werte durch null ersetzen
- Preise als Zahlen formatieren (Komma zu Punkt)`;
      
      userPrompt = `Bereinige diese Daten:
${JSON.stringify(data?.slice(0, 20), null, 2)}

Gib die bereinigten Daten als JSON-Array zurück.`;
    }
    else if (type === 'categorize') {
      systemPrompt = `Du bist ein Kategorisierung-Assistent für Restaurant-Artikel. Weise jedem Artikel eine passende Kategorie zu.
Antworte NUR mit einem JSON-Array im Format: [{ "index": 0, "category": "Kategoriename" }, ...]
Verwende bevorzugt die existierenden Kategorien, erstelle aber bei Bedarf neue.`;
      
      const defaultCategories = ['Fleisch', 'Fisch', 'Gemüse', 'Obst', 'Milchprodukte', 'Getränke', 'Gewürze', 'Backwaren', 'Tiefkühl', 'Konserven', 'Öle & Fette', 'Saucen', 'Reinigung', 'Verpackung'];
      const categories = existingCategories?.length ? existingCategories : defaultCategories;
      
      userPrompt = `Kategorisiere diese Artikel:
${data?.slice(0, 50).map((item, i) => `${i}: ${item.name || item.Name || item.Artikelname || Object.values(item)[0]}`).join('\n')}

Verfügbare Kategorien: ${categories.join(', ')}

Du kannst auch neue Kategorien erstellen, wenn nötig.`;
    }

    console.log(`Processing ${type} request`);

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
        temperature: 0.3,
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
      throw new Error("AI gateway error");
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
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse AI response");
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
