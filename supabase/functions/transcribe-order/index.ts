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

interface Article {
  id: string;
  name: string;
  unit: string;
  order_unit_name?: string;
}

interface MatchedItem {
  article_id: string;
  name: string;
  quantity: number;
  confidence: 'high' | 'medium' | 'low';
  unit: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, articles, language = 'de' } = await req.json();

    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    if (!articles || articles.length === 0) {
      throw new Error('No articles provided for matching');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[transcribe-order] Processing audio, language hint: ${language}, articles count: ${articles.length}`);

    // Step 1: Transcribe audio with Whisper
    const binaryAudio = processBase64Chunks(audioBase64);
    const formData = new FormData();
    const audioBuffer = new ArrayBuffer(binaryAudio.length);
    new Uint8Array(audioBuffer).set(binaryAudio);
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    console.log('[transcribe-order] Sending to Whisper...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('[transcribe-order] Whisper error:', errorText);
      throw new Error(`Whisper API error: ${errorText}`);
    }

    const whisperResult = await whisperResponse.json();
    const transcript = whisperResult.text;
    console.log('[transcribe-order] Transcript:', transcript);

    if (!transcript || transcript.trim() === '') {
      return new Response(
        JSON.stringify({ 
          transcript: '', 
          items: [],
          message: 'No speech detected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Match transcript to articles using Lovable AI (Gemini)
    const articleList = articles.map((a: Article) => 
      `- ID: ${a.id}, Name: "${a.name}", Unit: "${a.order_unit_name || a.unit}"`
    ).join('\n');

    const matchingPrompt = `You are an order parsing assistant. Analyze the following spoken order and match it to the available articles.

AVAILABLE ARTICLES:
${articleList}

SPOKEN ORDER (transcribed):
"${transcript}"

INSTRUCTIONS:
1. Extract quantities and article names from the spoken order
2. Match each mentioned item to the most similar article from the list
3. If a quantity is not specified, assume 1
4. Assign confidence levels:
   - "high": exact or very close match
   - "medium": partial match or unclear quantity
   - "low": uncertain match, needs verification

Return a JSON array of matched items. Each item should have:
- article_id: the ID from the article list
- name: the article name
- quantity: the extracted quantity (integer)
- confidence: "high", "medium", or "low"
- unit: the unit from the article

IMPORTANT: Only return the JSON array, no other text. If no items could be matched, return an empty array [].`;

    console.log('[transcribe-order] Sending to Lovable AI for matching...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: matchingPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[transcribe-order] Lovable AI error:', errorText);
      // Return transcript without matching on AI error
      return new Response(
        JSON.stringify({ 
          transcript, 
          items: [],
          error: 'Could not match articles'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '[]';
    console.log('[transcribe-order] AI response:', aiContent);

    // Parse the AI response
    let matchedItems: MatchedItem[] = [];
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      matchedItems = JSON.parse(jsonStr);
      
      // Validate and sanitize items
      matchedItems = matchedItems.filter(item => 
        item.article_id && 
        item.quantity > 0 && 
        articles.some((a: Article) => a.id === item.article_id)
      ).map(item => ({
        ...item,
        quantity: Math.max(1, Math.round(item.quantity)),
        confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'medium'
      }));
    } catch (parseError) {
      console.error('[transcribe-order] Failed to parse AI response:', parseError);
      matchedItems = [];
    }

    console.log('[transcribe-order] Matched items:', matchedItems.length);

    return new Response(
      JSON.stringify({ 
        transcript, 
        items: matchedItems 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe-order] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
