import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse, getErrorMessage } from "../_shared/cors.ts";

// Validate simple_order_token
async function validateToken(token: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('simple_order_tokens')
    .select('id, is_active, expires_at, employees!simple_order_tokens_employee_id_fkey(voice_input_enabled)')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) {
    console.log('[elevenlabs-tts] Token not found');
    return false;
  }

  if (!data.is_active) {
    console.log('[elevenlabs-tts] Token is inactive');
    return false;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log('[elevenlabs-tts] Token has expired');
    return false;
  }

  // Check if employee has voice input enabled
  const employees = data.employees as Array<{ voice_input_enabled: boolean }> | null;
  if (employees && employees.length > 0 && !employees[0].voice_input_enabled) {
    console.log('[elevenlabs-tts] Voice input not enabled for employee');
    return false;
  }

  return true;
}

// Voice mapping by language (using multilingual model for all)
const VOICE_BY_LANGUAGE: Record<string, string> = {
  de: 'FGY2WhTYpPnrIDTdsKH5', // Laura - German
  th: 'XrExE9yKIg1WjnnlVkGX', // Matilda - good multilingual voice for Thai
  en: 'EXAVITQu4vr4xnSDxMaL', // Sarah - English
  fr: 'XrExE9yKIg1WjnnlVkGX', // Matilda - French
  vi: 'XrExE9yKIg1WjnnlVkGX', // Matilda - Vietnamese
};
const DEFAULT_VOICE_ID = 'FGY2WhTYpPnrIDTdsKH5';

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { token, text, voiceId, language } = await req.json();

    // Validate token first to prevent unauthorized API usage
    if (!token) {
      console.error('[elevenlabs-tts] No token provided');
      return errorResponse('Authentication required', 401);
    }

    const isValidToken = await validateToken(token);
    if (!isValidToken) {
      console.error('[elevenlabs-tts] Invalid or expired token');
      return errorResponse('Invalid or expired token', 403);
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return errorResponse('Text is required', 400);
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    // Select voice based on language, fallback to provided voiceId or default
    const langCode = language?.substring(0, 2) || 'de';
    const selectedVoiceId = voiceId || VOICE_BY_LANGUAGE[langCode] || DEFAULT_VOICE_ID;
    
    console.log('[elevenlabs-tts] Generating speech for text:', text.substring(0, 50) + '...');

    // Request TTS from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Fast, low-latency model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.1, // Slightly faster for order readback
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[elevenlabs-tts] ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);
    
    console.log('[elevenlabs-tts] Speech generated successfully, size:', audioBuffer.byteLength);

    return jsonResponse({ audioContent: audioBase64 });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('[elevenlabs-tts] Error:', errorMessage);
    return errorResponse(errorMessage);
  }
});
