import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface EmployeeData {
  id: string;
  pin_code: string | null;
  auto_approve_orders: boolean;
}

interface TokenWithEmployee {
  id: string;
  employee_id: string | null;
  employee: EmployeeData | EmployeeData[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, pin } = await req.json();

    if (!token || !pin) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying PIN for token:', token.substring(0, 8) + '...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- SERVER-SIDE RATE LIMITING ---
    // Clean up old rate limit entries first
    await supabase.rpc('cleanup_pin_verification_rate_limits');

    // Check current rate limit count for this token
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: attemptCount, error: countError } = await supabase
      .from('pin_verification_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('token', token)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    const currentAttempts = attemptCount || 0;
    console.log(`Rate limit check: ${currentAttempts}/${MAX_ATTEMPTS} attempts in last ${RATE_LIMIT_WINDOW_MINUTES} minutes`);

    if (currentAttempts >= MAX_ATTEMPTS) {
      console.log('Rate limit exceeded for token');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'rate_limit_exceeded',
          remainingMinutes: RATE_LIMIT_WINDOW_MINUTES 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get token with employee info including pin_code
    const { data: tokenData, error: tokenError } = await supabase
      .from('simple_order_tokens')
      .select(`
        id,
        employee_id,
        employee:employees(id, pin_code, auto_approve_orders)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.log('Token not found:', tokenError?.message);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedToken = tokenData as TokenWithEmployee;
    const emp = typedToken.employee;
    const employee = Array.isArray(emp) ? emp[0] : emp;
    
    if (!employee?.pin_code) {
      console.log('No PIN configured for employee');
      return new Response(
        JSON.stringify({ valid: false, error: 'No PIN configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compare PIN using bcrypt
    // Support both hashed (starts with $2) and legacy plaintext PINs
    let isValid = false;
    const storedPin = employee.pin_code;
    
    if (storedPin.startsWith('$2')) {
      // Hashed PIN - use bcrypt comparison (sync version for Deno compatibility)
      isValid = bcrypt.compareSync(pin, storedPin);
      console.log('PIN verification (bcrypt):', isValid ? 'valid' : 'invalid');
    } else {
      // Legacy plaintext PIN - direct comparison (for backward compatibility)
      isValid = storedPin === pin;
      console.log('PIN verification (legacy plaintext):', isValid ? 'valid' : 'invalid');
    }

    // Record this attempt for rate limiting (only for failed attempts)
    if (!isValid) {
      const { error: insertError } = await supabase
        .from('pin_verification_rate_limits')
        .insert({ token });
      
      if (insertError) {
        console.error('Error recording rate limit:', insertError);
      }
      
      const remainingAttempts = MAX_ATTEMPTS - currentAttempts - 1;
      return new Response(
        JSON.stringify({ 
          valid: false,
          remainingAttempts: Math.max(0, remainingAttempts)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // On successful verification, clear rate limit entries for this token
    await supabase
      .from('pin_verification_rate_limits')
      .delete()
      .eq('token', token);

    return new Response(
      JSON.stringify({ valid: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-employee-pin:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
