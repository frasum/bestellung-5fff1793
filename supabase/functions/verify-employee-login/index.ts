import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  email: string;
  pin: string;
}

interface VerifySessionRequest {
  sessionToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const action = body.action || 'login';

    // Action: Verify existing session
    if (action === 'verify') {
      const { sessionToken } = body as VerifySessionRequest;

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cleanup expired sessions first
      await supabase.rpc('cleanup_expired_employee_sessions');

      // Find valid session
      const { data: session, error: sessionError } = await supabase
        .from('employee_sessions')
        .select(`
          id,
          employee_id,
          expires_at,
          employees (
            id,
            name,
            email,
            organization_id,
            auto_approve_orders,
            is_active
          )
        `)
        .eq('token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const employee = session.employees as any;
      if (!employee || !employee.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: 'Employee not active' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get employee's assigned locations
      const { data: employeeLocations } = await supabase
        .from('employee_locations')
        .select('location_id, locations(id, name, short_code)')
        .eq('employee_id', employee.id);

      // Get employee's location-supplier assignments
      const { data: locationSuppliers } = await supabase
        .from('employee_location_suppliers')
        .select('location_id, supplier_id')
        .eq('employee_id', employee.id);

      return new Response(
        JSON.stringify({
          success: true,
          employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            organizationId: employee.organization_id,
            autoApproveOrders: employee.auto_approve_orders,
          },
          locations: employeeLocations?.map((el: any) => el.locations) || [],
          locationSuppliers: locationSuppliers || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Login
    const { email, pin } = body as LoginRequest;

    if (!email || !pin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and PIN required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find employee by email
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, organization_id, pin_code, auto_approve_orders, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (empError || !employee) {
      console.log('Employee not found:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify PIN
    if (!employee.pin_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'No PIN configured for this employee' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pinValid = await bcrypt.compare(pin, employee.pin_code);
    if (!pinValid) {
      console.log('Invalid PIN for employee:', employee.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('employee_sessions')
      .insert({ employee_id: employee.id })
      .select('token, expires_at')
      .single();

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get employee's assigned locations
    const { data: employeeLocations } = await supabase
      .from('employee_locations')
      .select('location_id, locations(id, name, short_code)')
      .eq('employee_id', employee.id);

    // Get employee's location-supplier assignments
    const { data: locationSuppliers } = await supabase
      .from('employee_location_suppliers')
      .select('location_id, supplier_id')
      .eq('employee_id', employee.id);

    console.log('Login successful for employee:', employee.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken: session.token,
        expiresAt: session.expires_at,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          organizationId: employee.organization_id,
          autoApproveOrders: employee.auto_approve_orders,
        },
        locations: employeeLocations?.map((el: any) => el.locations) || [],
        locationSuppliers: locationSuppliers || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-employee-login:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
