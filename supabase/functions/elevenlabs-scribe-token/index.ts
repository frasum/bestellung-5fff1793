import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    console.log('[elevenlabs-scribe-token] Token not found');
    return false;
  }

  if (!data.is_active) {
    console.log('[elevenlabs-scribe-token] Token is inactive');
    return false;
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log('[elevenlabs-scribe-token] Token has expired');
    return false;
  }

  // Check if employee has voice input enabled
  const employees = data.employees as Array<{ voice_input_enabled: boolean }> | null;
  if (employees && employees.length > 0 && !employees[0].voice_input_enabled) {
    console.log('[elevenlabs-scribe-token] Voice input not enabled for employee');
    return false;
  }

  return true;
}

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { token } = await req.json();

    // Validate token first to prevent unauthorized API usage
    if (!token) {
      console.error('[elevenlabs-scribe-token] No token provided');
      return errorResponse('Authentication required', 401);
    }

    const isValidToken = await validateToken(token);
    if (!isValidToken) {
      console.error('[elevenlabs-scribe-token] Invalid or expired token');
      return errorResponse('Invalid or expired token', 403);
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    console.log('[elevenlabs-scribe-token] Requesting single-use token for realtime scribe...');

    // Request a single-use token for realtime scribe
    const response = await fetch(
      'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[elevenlabs-scribe-token] ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('[elevenlabs-scribe-token] Token generated successfully');

    return jsonResponse({ token: result.token });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('[elevenlabs-scribe-token] Error:', errorMessage);
    return errorResponse(errorMessage);
  }
});
