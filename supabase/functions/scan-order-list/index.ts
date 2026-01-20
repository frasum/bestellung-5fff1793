import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, articles } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create article list for context
    interface ArticleInput {
      name: string;
      sku?: string | null;
      unit: string;
    }
    const articleList = (articles as ArticleInput[]).map((a) => 
      `- "${a.name}" (SKU: ${a.sku || 'N/A'}, Einheit: ${a.unit})`
    ).join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du bist ein Assistent für die Erkennung von handschriftlichen Bestelllisten. 
Analysiere das Bild einer ausgefüllten Bestellliste und extrahiere die Artikelnamen und Mengen.

Hier ist die Liste der verfügbaren Artikel in der Datenbank:
${articleList}

Deine Aufgabe:
1. Erkenne die handschriftlichen Einträge im Bild (Artikelname und Menge)
2. Versuche jeden erkannten Eintrag einem Artikel aus der Datenbank zuzuordnen
3. Gib das Ergebnis als JSON zurück

Antworte NUR mit einem JSON-Objekt in folgendem Format:
{
  "items": [
    {
      "recognized_text": "erkannter Text aus dem Bild",
      "quantity": Zahl oder null wenn nicht erkennbar,
      "matched_article_name": "exakter Name aus der Datenbank" oder null,
      "confidence": "high" | "medium" | "low"
    }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analysiere diese handschriftlich ausgefüllte Bestellliste und extrahiere die Artikel und Mengen:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte später erneut versuchen." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht. Bitte Guthaben aufladen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse JSON from response
    let result;
    try {
      // Handle markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      result = { items: [], error: "Konnte die Antwort nicht verarbeiten" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("scan-order-list error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
