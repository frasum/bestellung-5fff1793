import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  supplier_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, articles } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    if (!articles || articles.length === 0) {
      throw new Error('No articles provided for matching');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing order text:', text);
    console.log('Available articles count:', articles.length);

    // Build article list for prompt
    const articleList = articles.map((a: Article) => 
      `- ID: ${a.id}, Name: "${a.name}"${a.sku ? `, SKU: "${a.sku}"` : ''}, Einheit: ${a.unit}, Lieferant: ${a.supplier_name}`
    ).join('\n');

    const systemPrompt = `Du bist ein Assistent für Bestellungserfassung in einem Restaurant. 
Analysiere den gesprochenen oder geschriebenen Text und extrahiere Bestellpositionen.
Matche die genannten Artikel mit der verfügbaren Artikelliste.

Verfügbare Artikel:
${articleList}

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    "article_id": "uuid-des-artikels",
    "article_name": "Name des Artikels",
    "quantity": 5,
    "recognized_text": "ursprünglicher Text für diesen Artikel",
    "confidence": 0.95
  }
]

Regeln:
- Wenn ein Artikel nicht eindeutig zugeordnet werden kann, setze confidence < 0.7
- Wenn keine Menge genannt wird, nimm 1 an
- Ignoriere irrelevante Teile des Textes
- Bei Zahlen: "fünf" = 5, "ein Dutzend" = 12, etc.
- Berücksichtige typische Mengenangaben: "Kiste", "Karton", "Palette"`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '[]';
    
    // Clean up response if wrapped in markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('AI response:', content);

    let items = [];
    try {
      items = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      items = [];
    }

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-order-text:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
