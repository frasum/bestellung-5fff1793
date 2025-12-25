import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { employeeId, pin } = await req.json();

    if (!employeeId) {
      return errorResponse('Employee ID is required', 400);
    }

    console.log('Hashing PIN for employee:', employeeId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Not authenticated', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return errorResponse('Invalid token', 401);
    }

    // Verify user is admin in the organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return errorResponse('No organization found', 403);
    }

    const { data: hasRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!hasRole) {
      return errorResponse('Only admins can set PINs', 403);
    }

    // Verify employee belongs to the user's organization
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, organization_id')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return errorResponse('Employee not found', 404);
    }

    if (employee.organization_id !== profile.organization_id) {
      return errorResponse('Employee not in your organization', 403);
    }

    // Hash PIN if provided, or set to null if empty/removed
    let hashedPin: string | null = null;
    if (pin && pin.length === 4) {
      // Use hashSync instead of hash to avoid Worker dependency in Edge Functions
      hashedPin = bcrypt.hashSync(pin);
      console.log('PIN hashed successfully');
    } else {
      console.log('PIN removed (empty or invalid)');
    }

    // Update employee with hashed PIN
    const { error: updateError } = await supabase
      .from('employees')
      .update({ pin_code: hashedPin })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return errorResponse('Failed to update PIN', 500);
    }

    return jsonResponse({ success: true });

  } catch (error) {
    console.error('Error in hash-employee-pin:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
});
