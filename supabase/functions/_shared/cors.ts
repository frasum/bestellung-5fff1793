/**
 * Shared CORS utilities for Supabase Edge Functions.
 * Import this in your edge functions to reduce boilerplate.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight requests.
 * Returns a Response for OPTIONS requests, or null for other methods.
 * 
 * Usage:
 * const corsRes = handleCors(req);
 * if (corsRes) return corsRes;
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/**
 * Create a JSON response with CORS headers.
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response with CORS headers.
 */
export function errorResponse(message: string, status = 500): Response {
  console.error(`Error response: ${message}`);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a success response with CORS headers.
 */
export function successResponse<T>(data?: T): Response {
  return jsonResponse({ success: true, ...data }, 200);
}

/**
 * Safely extract error message from unknown error type.
 * Use this in catch blocks instead of error: any.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}
