import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

interface ExtractedArticle {
  name: string;
  quantity?: number;
  unit: string;
  size?: string;
  category: string;
  suggested_order_unit?: string;
  confidence: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, language = 'de' } = await req.json();

    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[transcribe-inventory] Processing audio, language: ${language}`);

    // Step 1: Transcribe audio with Whisper
    const binaryAudio = processBase64Chunks(audioBase64);
    const formData = new FormData();
    const audioBuffer = new ArrayBuffer(binaryAudio.length);
    new Uint8Array(audioBuffer).set(binaryAudio);
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language.substring(0, 2));

    console.log('[transcribe-inventory] Sending to Whisper...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('[transcribe-inventory] Whisper error:', errorText);
      throw new Error(`Whisper API error: ${errorText}`);
    }

    const whisperResult = await whisperResponse.json();
    const transcript = whisperResult.text;
    console.log('[transcribe-inventory] Transcript:', transcript);

    if (!transcript || transcript.trim() === '') {
      return new Response(
        JSON.stringify({ 
          transcript: '', 
          articles: [],
          message: 'No speech detected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Extract article data using Lovable AI (Gemini)
    const extractionPrompt = `Du bist ein Experte für Restaurant-Inventar und Lebensmittel. Analysiere diese gesprochene Inventarbeschreibung und extrahiere alle erwähnten Artikel mit ihren Eigenschaften.

GESPROCHENE INVENTARBESCHREIBUNG:
"${transcript}"

ANWEISUNGEN:
1. Extrahiere jeden erwähnten Artikel als separates Objekt
2. Identifiziere Mengen, Einheiten, Gebindegrößen und Produktnamen
3. Schätze eine passende Kategorie (z.B. "Getränke", "Gemüse", "Fleisch", "Milchprodukte", "Gewürze", "Tiefkühl", "Konserven", "Backwaren", "Sonstiges")
4. Schlage eine Bestelleinheit vor (z.B. "Fass", "Träger", "Kiste", "Karton", "Bund", "Stk", "kg")
5. Bewerte dein Vertrauen in die Erkennung:
   - "high": Klare Nennung mit Menge und Einheit
   - "medium": Teilweise unklar aber erkennbar
   - "low": Unsicher, benötigt Überprüfung

BEISPIELE FÜR INTERPRETATION:
- "drei fünfzig Liter Fässer Helmbier" → { name: "Helmbier", quantity: 3, unit: "Fass", size: "50L", category: "Getränke" }
- "Träger Coca Cola null zwei mit sechzehn Flaschen" → { name: "Coca Cola", unit: "Träger", size: "16x 0,2L", category: "Getränke" }
- "zwei Kartons Tomaten" → { name: "Tomaten", quantity: 2, unit: "Karton", category: "Gemüse" }

WICHTIG: Antworte NUR mit einem JSON-Array. Kein anderer Text.

Format pro Artikel:
{
  "name": "Produktname",
  "quantity": Anzahl (Zahl oder null wenn nicht genannt),
  "unit": "Einheit",
  "size": "Gebindegröße falls erwähnt",
  "category": "Geschätzte Kategorie",
  "suggested_order_unit": "Vorgeschlagene Bestelleinheit",
  "confidence": "high|medium|low"
}`;

    console.log('[transcribe-inventory] Sending to Lovable AI for extraction...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: extractionPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[transcribe-inventory] Lovable AI error:', errorText);
      // Return transcript without extraction on AI error
      return new Response(
        JSON.stringify({ 
          transcript, 
          articles: [],
          error: 'Could not extract articles'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '[]';
    console.log('[transcribe-inventory] AI response:', aiContent);

    // Parse the AI response
    let extractedArticles: ExtractedArticle[] = [];
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      extractedArticles = JSON.parse(jsonStr);
      
      // Validate and sanitize articles
      extractedArticles = extractedArticles
        .filter(article => article.name && article.name.trim())
        .map(article => ({
          name: article.name.trim(),
          quantity: article.quantity ? Math.max(1, Math.round(article.quantity)) : undefined,
          unit: article.unit || 'Stk',
          size: article.size || undefined,
          category: article.category || 'Sonstiges',
          suggested_order_unit: article.suggested_order_unit || article.unit || 'Stk',
          confidence: ['high', 'medium', 'low'].includes(article.confidence) ? article.confidence : 'medium'
        }));
    } catch (parseError) {
      console.error('[transcribe-inventory] Failed to parse AI response:', parseError);
      extractedArticles = [];
    }

    console.log('[transcribe-inventory] Extracted articles:', extractedArticles.length);

    return new Response(
      JSON.stringify({ 
        transcript, 
        articles: extractedArticles 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe-inventory] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
